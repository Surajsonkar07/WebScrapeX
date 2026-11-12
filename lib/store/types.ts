import type { ScrapeMode, ScrapeEngine, ScrapeOptions, ScrapeResult } from '@/lib/scraper-types';

export type JobStatus = 'pending' | 'scraping' | 'completed' | 'failed';

export interface Job {
    id: string;
    userId: string;
    url: string;
    status: JobStatus;
    mode: ScrapeMode;
    engine: ScrapeEngine;
    title: string | null;
    favicon: string | null;
    rows: number | null;
    error: string | null;
    createdAt: string;
    completedAt: string | null;
}

export interface JobLog {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    createdAt: string;
}

export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;
    lastUsedAt: string | null;
}

export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface Schedule {
    id: string;
    userId: string;
    url: string;
    options: Omit<ScrapeOptions, 'url'>;
    frequency: Frequency;
    webhookUrl: string | null;
    active: boolean;
    nextRunAt: string;
    lastRunAt: string | null;
    lastJobId: string | null;
    createdAt: string;
}

export interface StoredFile {
    body: Buffer;
    contentType: string;
}

export interface Stats {
    jobs: number;
    completed: number;
    failed: number;
    users: number | null;
    last24h: number;
    recentFailures: Array<Pick<Job, 'id' | 'url' | 'error' | 'createdAt'>>;
    topHosts: Array<{ host: string; count: number }>;
}

/** Raised when the database is reachable but a table from the migration is missing. */
export class MigrationNeededError extends Error {
    constructor(public table: string) {
        super(`The “${table}” table is missing. Run supabase/schema.sql in the Supabase SQL editor.`);
    }
}

export interface Store {
    kind: 'supabase' | 'local';
    createJob(userId: string, options: ScrapeOptions): Promise<Job>;
    log(jobId: string, message: string, type?: JobLog['type']): Promise<void>;
    completeJob(job: Job, result: ScrapeResult): Promise<void>;
    failJob(job: Job, message: string): Promise<void>;
    listJobs(userId: string, q: { limit: number; offset: number; search?: string; status?: JobStatus }): Promise<{ jobs: Job[]; total: number }>;
    getJob(userId: string, id: string): Promise<Job | null>;
    getResult(userId: string, id: string): Promise<ScrapeResult | null>;
    getLogs(userId: string, id: string): Promise<JobLog[]>;
    deleteJob(userId: string, id: string): Promise<boolean>;
    putFile(jobId: string, name: string, body: Buffer, contentType: string): Promise<boolean>;
    getFile(userId: string, jobId: string, name: string): Promise<StoredFile | null>;
    listFiles(userId: string, jobId: string): Promise<string[]>;

    listKeys(userId: string): Promise<ApiKey[]>;
    createKey(userId: string, name: string, prefix: string, hash: string): Promise<ApiKey>;
    deleteKey(userId: string, id: string): Promise<boolean>;
    resolveKey(hash: string): Promise<{ userId: string; email: string | null } | null>;

    listSchedules(userId: string): Promise<Schedule[]>;
    createSchedule(s: Omit<Schedule, 'id' | 'createdAt' | 'lastRunAt' | 'lastJobId'>): Promise<Schedule>;
    deleteSchedule(userId: string, id: string): Promise<boolean>;
    setScheduleActive(userId: string, id: string, active: boolean): Promise<boolean>;
    dueSchedules(limit: number): Promise<Schedule[]>;
    markScheduleRun(id: string, jobId: string, nextRunAt: string): Promise<void>;

    stats(): Promise<Stats>;
}

export function nextRun(frequency: Frequency, from = new Date()): string {
    const d = new Date(from);
    if (frequency === 'daily') d.setUTCDate(d.getUTCDate() + 1);
    else if (frequency === 'weekly') d.setUTCDate(d.getUTCDate() + 7);
    else d.setUTCMonth(d.getUTCMonth() + 1);
    return d.toISOString();
}

export function rowCount(result: ScrapeResult): number | null {
    if (result.fields) return result.fields.rows.length;
    if (result.tables?.length) return result.tables.reduce((n, t) => n + t.rows.length, 0);
    if (result.links) return result.links.length;
    return null;
}

export const SAFE_FILE = /^[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._-]+)?$/;
