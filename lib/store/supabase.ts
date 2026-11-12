import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { ScrapeOptions, ScrapeResult } from '@/lib/scraper-types';
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { contentTypeFor } from './local';
import { MigrationNeededError, rowCount, SAFE_FILE, type ApiKey, type Job, type JobLog, type Schedule, type Store } from './types';

const BUCKET = 'scrapes';

/**
 * `websites` is the job table (kept from v1 so existing history still shows).
 * v2 keeps the job options in `notes` as JSON; `metadata`, `logs` and `assets`
 * are written exactly as before. Full results live in Storage at `<id>/result.json`.
 */
interface WebsiteRow {
    id: string;
    url: string;
    status: Job['status'];
    created_at: string;
    completed_at: string | null;
    total_assets: number | null;
    notes: string | null;
    user_id: string | null;
}

interface Notes {
    mode?: Job['mode'];
    engine?: Job['engine'];
    title?: string | null;
    favicon?: string | null;
    rows?: number | null;
    error?: string | null;
}

function parseNotes(n: string | null): Notes {
    if (!n) return {};
    try {
        const v = JSON.parse(n);
        return v && typeof v === 'object' ? v : {};
    } catch {
        return {};
    }
}

function toJob(r: WebsiteRow): Job {
    const n = parseNotes(r.notes);
    return {
        id: r.id,
        userId: r.user_id ?? '',
        url: r.url,
        status: r.status,
        mode: n.mode ?? 'full',
        engine: n.engine ?? 'static',
        title: n.title ?? null,
        favicon: n.favicon ?? null,
        rows: n.rows ?? null,
        error: n.error ?? null,
        createdAt: r.created_at,
        completedAt: r.completed_at,
    };
}

function check(error: PostgrestError | null, table: string) {
    if (!error) return;
    if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message)) {
        throw new MigrationNeededError(table);
    }
    throw new Error(`${table}: ${error.message}`);
}

/** Admin client when the service key exists; otherwise the signed-in user's client (RLS). */
async function db(): Promise<SupabaseClient> {
    return supabaseAdmin() ?? (await createSupabaseServer());
}

function requireAdmin(feature: string): SupabaseClient {
    const a = supabaseAdmin();
    if (!a) throw new Error(`${feature} needs SUPABASE_SERVICE_ROLE_KEY on the server.`);
    return a;
}

const WEBSITE_COLS = 'id,url,status,created_at,completed_at,total_assets,notes,user_id';

async function patchNotes(client: SupabaseClient, id: string, patch: Notes, extra: Record<string, unknown> = {}) {
    const { data } = await client.from('websites').select('notes').eq('id', id).maybeSingle();
    const notes = { ...parseNotes((data as { notes: string | null } | null)?.notes ?? null), ...patch };
    const { error } = await client.from('websites').update({ notes: JSON.stringify(notes), ...extra }).eq('id', id);
    check(error, 'websites');
}

export const supabaseStore: Store = {
    kind: 'supabase',

    async createJob(userId, o: ScrapeOptions) {
        const client = await db();
        const row = {
            id: randomUUID(),
            url: o.url,
            status: 'scraping' as const,
            user_id: userId,
            notes: JSON.stringify({ mode: o.mode, engine: o.engine } satisfies Notes),
        };
        const { data, error } = await client.from('websites').insert(row).select(WEBSITE_COLS).single();
        check(error, 'websites');
        return toJob(data as WebsiteRow);
    },

    async log(jobId, message, type = 'info') {
        const client = await db();
        await client.from('logs').insert({ website_id: jobId, message: message.slice(0, 1000), type });
    },

    async completeJob(job, result: ScrapeResult) {
        const client = await db();
        const body = Buffer.from(JSON.stringify(result));
        const up = await client.storage.from(BUCKET).upload(`${job.id}/result.json`, body, { contentType: 'application/json', upsert: true });
        if (up.error) throw new Error(`Could not save the result to Storage bucket “${BUCKET}”: ${up.error.message}`);

        // v1-compatible summary row
        await client.from('metadata').insert({
            website_id: job.id,
            title: result.metadata.title,
            description: result.metadata.description,
            keywords: result.metadata.keywords.join(', '),
            favicon: result.metadata.favicon,
            color_palette: result.colors ?? [],
            fonts: result.fonts ?? [],
            technologies: result.technologies ?? [],
        });

        await patchNotes(
            client,
            job.id,
            { engine: result.options.engine, title: result.metadata.title || null, favicon: result.metadata.favicon || null, rows: rowCount(result) },
            { status: 'completed', completed_at: result.completedAt, url: result.url, total_assets: result.images?.length ?? 0 },
        );
    },

    async failJob(job, message) {
        const client = await db();
        await patchNotes(client, job.id, { error: message }, { status: 'failed', completed_at: new Date().toISOString() });
    },

    async listJobs(userId, q) {
        const client = await db();
        let query = client.from('websites').select(WEBSITE_COLS, { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false });
        if (q.status) query = query.eq('status', q.status);
        if (q.search) query = query.ilike('url', `%${q.search.replace(/[%_,()]/g, '')}%`);
        const { data, error, count } = await query.range(q.offset, q.offset + q.limit - 1);
        check(error, 'websites');
        const jobs = (data as WebsiteRow[]).map(toJob);

        // v1 rows have no title in notes: fill from the metadata table.
        const missing = jobs.filter((j) => !j.title && j.status === 'completed').map((j) => j.id);
        if (missing.length) {
            const { data: meta } = await client.from('metadata').select('website_id,title,favicon').in('website_id', missing);
            (meta as Array<{ website_id: string; title: string | null; favicon: string | null }> | null)?.forEach((m) => {
                const j = jobs.find((x) => x.id === m.website_id);
                if (j) Object.assign(j, { title: m.title, favicon: m.favicon });
            });
        }
        return { jobs, total: count ?? jobs.length };
    },

    async getJob(userId, id) {
        if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
        const client = await db();
        const { data, error } = await client.from('websites').select(WEBSITE_COLS).eq('id', id).eq('user_id', userId).maybeSingle();
        check(error, 'websites');
        return data ? toJob(data as WebsiteRow) : null;
    },

    async getResult(userId, id) {
        const job = await this.getJob(userId, id);
        if (!job) return null;
        const client = await db();
        const { data } = await client.storage.from(BUCKET).download(`${id}/result.json`);
        if (data) {
            const parsed = JSON.parse(await data.text());
            if (parsed?.version === 2) return parsed as ScrapeResult;
            return upgradeV1(parsed, job);
        }
        // v1 fallback: rebuild what we can from the metadata row.
        const { data: meta } = await client.from('metadata').select('*').eq('website_id', id).maybeSingle();
        if (!meta) return null;
        return upgradeV1({ url: job.url, metadata: meta, colors: meta.color_palette, fonts: meta.fonts, technologies: meta.technologies }, job);
    },

    async getLogs(userId, id) {
        if (!(await this.getJob(userId, id))) return [];
        const client = await db();
        const { data } = await client.from('logs').select('message,type,created_at').eq('website_id', id).order('created_at', { ascending: true }).limit(200);
        return ((data ?? []) as Array<{ message: string; type: JobLog['type']; created_at: string }>).map((l) => ({ message: l.message, type: l.type, createdAt: l.created_at }));
    },

    async deleteJob(userId, id) {
        if (!(await this.getJob(userId, id))) return false;
        const client = await db();
        const { data: files } = await client.storage.from(BUCKET).list(id, { limit: 1000 });
        const { data: assetFiles } = await client.storage.from(BUCKET).list(`${id}/assets`, { limit: 1000 });
        const paths = [
            ...(files ?? []).filter((f) => f.id).map((f) => `${id}/${f.name}`),
            ...(assetFiles ?? []).map((f) => `${id}/assets/${f.name}`),
        ];
        if (paths.length) await client.storage.from(BUCKET).remove(paths);
        await client.from('logs').delete().eq('website_id', id);
        await client.from('assets').delete().eq('website_id', id);
        await client.from('metadata').delete().eq('website_id', id);
        const { error } = await client.from('websites').delete().eq('id', id).eq('user_id', userId);
        check(error, 'websites');
        return true;
    },

    async putFile(jobId, name, body, contentType) {
        if (!SAFE_FILE.test(name)) return false;
        const client = await db();
        const { error } = await client.storage.from(BUCKET).upload(`${jobId}/${name}`, body, { contentType, upsert: true });
        if (!error && name.startsWith('assets/')) {
            await client.from('assets').insert({ website_id: jobId, file_type: 'image', url: `${jobId}/${name}`, size_bytes: body.byteLength });
        }
        return !error;
    },

    async getFile(userId, jobId, name) {
        if (!SAFE_FILE.test(name) || !(await this.getJob(userId, jobId))) return null;
        const client = await db();
        const { data } = await client.storage.from(BUCKET).download(`${jobId}/${name}`);
        if (!data) return null;
        return { body: Buffer.from(await data.arrayBuffer()), contentType: contentTypeFor(name) };
    },

    async listFiles(userId, jobId) {
        if (!(await this.getJob(userId, jobId))) return [];
        const client = await db();
        const { data } = await client.storage.from(BUCKET).list(`${jobId}/assets`, { limit: 500 });
        return (data ?? []).map((f) => `assets/${f.name}`);
    },

    async listKeys(userId) {
        const { data, error } = await requireAdmin('API keys').from('api_keys').select('id,name,prefix,created_at,last_used_at').eq('user_id', userId).order('created_at', { ascending: false });
        check(error, 'api_keys');
        return ((data ?? []) as Array<{ id: string; name: string; prefix: string; created_at: string; last_used_at: string | null }>).map(
            (k): ApiKey => ({ id: k.id, name: k.name, prefix: k.prefix, createdAt: k.created_at, lastUsedAt: k.last_used_at }),
        );
    },

    async createKey(userId, name, prefix, hash) {
        const { data, error } = await requireAdmin('API keys').from('api_keys').insert({ user_id: userId, name, prefix, key_hash: hash }).select('id,created_at').single();
        check(error, 'api_keys');
        const row = data as { id: string; created_at: string };
        return { id: row.id, name, prefix, createdAt: row.created_at, lastUsedAt: null };
    },

    async deleteKey(userId, id) {
        const { error, count } = await requireAdmin('API keys').from('api_keys').delete({ count: 'exact' }).eq('id', id).eq('user_id', userId);
        check(error, 'api_keys');
        return (count ?? 0) > 0;
    },

    async resolveKey(hash) {
        const admin = supabaseAdmin();
        if (!admin) return null;
        const { data, error } = await admin.from('api_keys').select('id,user_id').eq('key_hash', hash).maybeSingle();
        if (error || !data) return null;
        const row = data as { id: string; user_id: string };
        await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', row.id);
        const { data: u } = await admin.auth.admin.getUserById(row.user_id);
        return { userId: row.user_id, email: u?.user?.email ?? null };
    },

    async listSchedules(userId) {
        const { data, error } = await requireAdmin('Schedules').from('schedules').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        check(error, 'schedules');
        return ((data ?? []) as ScheduleRow[]).map(toSchedule);
    },

    async createSchedule(s) {
        const { data, error } = await requireAdmin('Schedules')
            .from('schedules')
            .insert({ user_id: s.userId, url: s.url, options: s.options, frequency: s.frequency, webhook_url: s.webhookUrl, active: s.active, next_run_at: s.nextRunAt })
            .select('*')
            .single();
        check(error, 'schedules');
        return toSchedule(data as ScheduleRow);
    },

    async deleteSchedule(userId, id) {
        const { error, count } = await requireAdmin('Schedules').from('schedules').delete({ count: 'exact' }).eq('id', id).eq('user_id', userId);
        check(error, 'schedules');
        return (count ?? 0) > 0;
    },

    async setScheduleActive(userId, id, active) {
        const { error, count } = await requireAdmin('Schedules').from('schedules').update({ active }, { count: 'exact' }).eq('id', id).eq('user_id', userId);
        check(error, 'schedules');
        return (count ?? 0) > 0;
    },

    async dueSchedules(limit) {
        const { data, error } = await requireAdmin('Schedules').from('schedules').select('*').eq('active', true).lte('next_run_at', new Date().toISOString()).order('next_run_at').limit(limit);
        check(error, 'schedules');
        return ((data ?? []) as ScheduleRow[]).map(toSchedule);
    },

    async markScheduleRun(id, jobId, nextRunAt) {
        await requireAdmin('Schedules').from('schedules').update({ last_run_at: new Date().toISOString(), last_job_id: jobId, next_run_at: nextRunAt }).eq('id', id);
    },

    async stats() {
        const admin = requireAdmin('Admin stats');
        const head = () => admin.from('websites').select('id', { count: 'exact', head: true });
        const [all, ok, bad, day] = await Promise.all([
            head(),
            head().eq('status', 'completed'),
            head().eq('status', 'failed'),
            head().gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),
        ]);
        const [jobs, completed, failed, last24h] = [all, ok, bad, day].map((r) => r.count ?? 0);
        const { data: fails } = await admin.from('websites').select(WEBSITE_COLS).eq('status', 'failed').order('created_at', { ascending: false }).limit(8);
        const { data: recent } = await admin.from('websites').select('url').order('created_at', { ascending: false }).limit(500);
        const hosts = new Map<string, number>();
        ((recent ?? []) as Array<{ url: string }>).forEach((r) => {
            try {
                const h = new URL(r.url).host;
                hosts.set(h, (hosts.get(h) ?? 0) + 1);
            } catch {
                /* ignore */
            }
        });
        let users: number | null = null;
        try {
            const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
            users = data?.users.length ?? null;
        } catch {
            users = null;
        }
        return {
            jobs,
            completed,
            failed,
            users,
            last24h,
            recentFailures: ((fails ?? []) as WebsiteRow[]).map(toJob).map(({ id, url, error, createdAt }) => ({ id, url, error, createdAt })),
            topHosts: [...hosts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([host, count]) => ({ host, count })),
        };
    },
};

interface ScheduleRow {
    id: string;
    user_id: string;
    url: string;
    options: Omit<ScrapeOptions, 'url'>;
    frequency: Schedule['frequency'];
    webhook_url: string | null;
    active: boolean;
    next_run_at: string;
    last_run_at: string | null;
    last_job_id: string | null;
    created_at: string;
}

function toSchedule(r: ScheduleRow): Schedule {
    return {
        id: r.id,
        userId: r.user_id,
        url: r.url,
        options: r.options,
        frequency: r.frequency,
        webhookUrl: r.webhook_url,
        active: r.active,
        nextRunAt: r.next_run_at,
        lastRunAt: r.last_run_at,
        lastJobId: r.last_job_id,
        createdAt: r.created_at,
    };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Maps a v1 result.json (or metadata row) onto the v2 shape so old history still opens. */
function upgradeV1(old: any, job: Job): ScrapeResult {
    const md = old?.metadata ?? {};
    const keywords = Array.isArray(md.keywords) ? md.keywords : typeof md.keywords === 'string' ? md.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [];
    return {
        version: 2,
        url: old?.url ?? job.url,
        options: { mode: job.mode, engine: job.engine, fields: [] },
        fetch: { requestedUrl: job.url, finalUrl: old?.url ?? job.url, status: 200, contentType: 'text/html', bytes: (old?.html ?? '').length, durationMs: 0, engine: job.engine, truncated: false },
        robots: { allowed: true, robotsUrl: '', status: 'missing' },
        metadata: { title: md.title ?? '', description: md.description ?? '', keywords, favicon: md.favicon ?? '' },
        links: Array.isArray(old?.links) ? old.links.map((href: string) => ({ href, text: '', kind: 'external' as const })) : undefined,
        images: Array.isArray(old?.images) ? old.images.map((i: any) => ({ url: typeof i === 'string' ? i : i.url, alt: '' })) : undefined,
        colors: Array.isArray(old?.colors) ? old.colors : undefined,
        fonts: Array.isArray(old?.fonts) ? old.fonts : undefined,
        technologies: Array.isArray(old?.technologies) ? old.technologies : undefined,
        social: old?.social,
        contentAnalysis: old?.contentAnalysis,
        linkedinProfile: old?.linkedinProfile,
        seo: old?.seo,
        screenshot: old?.screenshotUrl,
        pdfUrl: old?.pdfUrl,
        html: (old?.html ?? '').slice(0, 200_000),
        warnings: ['This job was captured by WebScrapeX v1; some sections may be missing.'],
        completedAt: job.completedAt ?? job.createdAt,
    };
}
