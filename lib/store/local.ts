import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ScrapeResult } from '@/lib/scraper-types';
import { rowCount, SAFE_FILE, type ApiKey, type Job, type JobLog, type Schedule, type Store } from './types';

/**
 * File-backed store used when Supabase is not configured. Everything lives in
 * `.data/` (git-ignored). Single-user: every request is the "local" user.
 */
const ROOT = path.join(process.cwd(), '.data');

interface Db {
    jobs: Job[];
    logs: Record<string, JobLog[]>;
    keys: Array<ApiKey & { userId: string; hash: string }>;
    schedules: Schedule[];
}

let cached: Db | null = null;
let chain: Promise<unknown> = Promise.resolve();

async function load(): Promise<Db> {
    if (cached) return cached;
    try {
        cached = JSON.parse(await readFile(path.join(ROOT, 'db.json'), 'utf8')) as Db;
    } catch {
        cached = { jobs: [], logs: {}, keys: [], schedules: [] };
    }
    return cached;
}

/** Serialises writes so concurrent requests cannot clobber db.json. */
function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
    const run = chain.then(async () => {
        const db = await load();
        const out = await fn(db);
        await mkdir(ROOT, { recursive: true });
        await writeFile(path.join(ROOT, 'db.json'), JSON.stringify(db));
        return out;
    });
    chain = run.catch(() => undefined);
    return run;
}

const resultPath = (id: string) => path.join(ROOT, 'results', `${id}.json`);
const filesDir = (id: string) => path.join(ROOT, 'files', id);

export const localStore: Store = {
    kind: 'local',

    createJob: (userId, o) =>
        mutate((db) => {
            const job: Job = {
                id: randomUUID(),
                userId,
                url: o.url,
                status: 'scraping',
                mode: o.mode,
                engine: o.engine,
                title: null,
                favicon: null,
                rows: null,
                error: null,
                createdAt: new Date().toISOString(),
                completedAt: null,
            };
            db.jobs.unshift(job);
            if (db.jobs.length > 2000) db.jobs.length = 2000;
            return job;
        }),

    log: (jobId, message, type = 'info') =>
        mutate((db) => {
            (db.logs[jobId] ??= []).push({ message, type, createdAt: new Date().toISOString() });
        }),

    async completeJob(job, result: ScrapeResult) {
        await mkdir(path.join(ROOT, 'results'), { recursive: true });
        await writeFile(resultPath(job.id), JSON.stringify(result));
        await mutate((db) => {
            const j = db.jobs.find((x) => x.id === job.id);
            if (!j) return;
            Object.assign(j, {
                status: 'completed',
                url: result.url,
                engine: result.options.engine,
                title: result.metadata.title || null,
                favicon: result.metadata.favicon || null,
                rows: rowCount(result),
                completedAt: result.completedAt,
            });
        });
    },

    failJob: (job, message) =>
        mutate((db) => {
            const j = db.jobs.find((x) => x.id === job.id);
            if (j) Object.assign(j, { status: 'failed', error: message, completedAt: new Date().toISOString() });
        }),

    async listJobs(userId, q) {
        const db = await load();
        const s = q.search?.toLowerCase();
        const all = db.jobs.filter(
            (j) => j.userId === userId && (!q.status || j.status === q.status) && (!s || j.url.toLowerCase().includes(s) || j.title?.toLowerCase().includes(s)),
        );
        return { jobs: all.slice(q.offset, q.offset + q.limit), total: all.length };
    },

    async getJob(userId, id) {
        return (await load()).jobs.find((j) => j.id === id && j.userId === userId) ?? null;
    },

    async getResult(userId, id) {
        if (!(await this.getJob(userId, id))) return null;
        try {
            return JSON.parse(await readFile(resultPath(id), 'utf8')) as ScrapeResult;
        } catch {
            return null;
        }
    },

    async getLogs(userId, id) {
        if (!(await this.getJob(userId, id))) return [];
        return (await load()).logs[id] ?? [];
    },

    async deleteJob(userId, id) {
        const ok = await mutate((db) => {
            const before = db.jobs.length;
            db.jobs = db.jobs.filter((j) => !(j.id === id && j.userId === userId));
            delete db.logs[id];
            return db.jobs.length < before;
        });
        if (ok) {
            await rm(resultPath(id), { force: true });
            await rm(filesDir(id), { recursive: true, force: true });
        }
        return ok;
    },

    async putFile(jobId, name, body) {
        if (!SAFE_FILE.test(name)) return false;
        const target = path.join(filesDir(jobId), name);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, body);
        return true;
    },

    async getFile(userId, jobId, name) {
        if (!SAFE_FILE.test(name) || !(await this.getJob(userId, jobId))) return null;
        try {
            const body = await readFile(path.join(filesDir(jobId), name));
            return { body, contentType: contentTypeFor(name) };
        } catch {
            return null;
        }
    },

    async listFiles(userId, jobId) {
        if (!(await this.getJob(userId, jobId))) return [];
        try {
            const assets = await readdir(path.join(filesDir(jobId), 'assets'));
            return assets.map((a) => `assets/${a}`);
        } catch {
            return [];
        }
    },

    async listKeys(userId) {
        return (await load()).keys.filter((k) => k.userId === userId).map(({ id, name, prefix, createdAt, lastUsedAt }) => ({ id, name, prefix, createdAt, lastUsedAt }));
    },

    createKey: (userId, name, prefix, hash) =>
        mutate((db) => {
            const key = { id: randomUUID(), userId, name, prefix, hash, createdAt: new Date().toISOString(), lastUsedAt: null };
            db.keys.push(key);
            return { id: key.id, name, prefix, createdAt: key.createdAt, lastUsedAt: null };
        }),

    deleteKey: (userId, id) =>
        mutate((db) => {
            const before = db.keys.length;
            db.keys = db.keys.filter((k) => !(k.id === id && k.userId === userId));
            return db.keys.length < before;
        }),

    resolveKey: (hash) =>
        mutate((db) => {
            const k = db.keys.find((x) => x.hash === hash);
            if (!k) return null;
            k.lastUsedAt = new Date().toISOString();
            return { userId: k.userId, email: null };
        }),

    async listSchedules(userId) {
        return (await load()).schedules.filter((s) => s.userId === userId);
    },

    createSchedule: (s) =>
        mutate((db) => {
            const row: Schedule = { ...s, id: randomUUID(), createdAt: new Date().toISOString(), lastRunAt: null, lastJobId: null };
            db.schedules.unshift(row);
            return row;
        }),

    deleteSchedule: (userId, id) =>
        mutate((db) => {
            const before = db.schedules.length;
            db.schedules = db.schedules.filter((s) => !(s.id === id && s.userId === userId));
            return db.schedules.length < before;
        }),

    setScheduleActive: (userId, id, active) =>
        mutate((db) => {
            const s = db.schedules.find((x) => x.id === id && x.userId === userId);
            if (s) s.active = active;
            return !!s;
        }),

    async dueSchedules(limit) {
        const now = Date.now();
        return (await load()).schedules.filter((s) => s.active && Date.parse(s.nextRunAt) <= now).slice(0, limit);
    },

    markScheduleRun: (id, jobId, nextRunAt) =>
        mutate((db) => {
            const s = db.schedules.find((x) => x.id === id);
            if (s) Object.assign(s, { lastRunAt: new Date().toISOString(), lastJobId: jobId, nextRunAt });
        }),

    async stats() {
        const db = await load();
        const day = Date.now() - 86_400_000;
        const hosts = new Map<string, number>();
        db.jobs.forEach((j) => {
            try {
                const h = new URL(j.url).host;
                hosts.set(h, (hosts.get(h) ?? 0) + 1);
            } catch {
                /* ignore */
            }
        });
        return {
            jobs: db.jobs.length,
            completed: db.jobs.filter((j) => j.status === 'completed').length,
            failed: db.jobs.filter((j) => j.status === 'failed').length,
            users: 1,
            last24h: db.jobs.filter((j) => Date.parse(j.createdAt) > day).length,
            recentFailures: db.jobs.filter((j) => j.status === 'failed').slice(0, 8).map(({ id, url, error, createdAt }) => ({ id, url, error, createdAt })),
            topHosts: [...hosts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([host, count]) => ({ host, count })),
        };
    },
};

export function contentTypeFor(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    return (
        {
            pdf: 'application/pdf',
            json: 'application/json',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            avif: 'image/avif',
            svg: 'image/svg+xml',
            ico: 'image/x-icon',
        } as Record<string, string>
    )[ext ?? ''] ?? 'application/octet-stream';
}
