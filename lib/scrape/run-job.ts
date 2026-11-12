import 'server-only';
import { env } from '@/lib/env';
import type { Viewer } from '@/lib/auth';
import { getStore, type Job } from '@/lib/store';
import type { ScrapeOptions, ScrapeResult } from '@/lib/scraper-types';
import { runScrape } from './engine';
import { take, type LimitResult } from './rate-limit';
import { normalizeUrl, ScrapeError } from './safe-fetch';
import { scrapeRequestSchema } from './schema';

export const scrapeRules = () => [
    { limit: env.perMinute, windowMs: 60_000 },
    { limit: env.perHour, windowMs: 3_600_000 },
];

export class RateLimitedError extends Error {
    constructor(public limit: LimitResult) {
        super(`Rate limit reached: ${limit.limit} scrapes per window. Try again in ${limit.retryAfter} s.`);
    }
}

export function parseScrapeRequest(body: unknown): ScrapeOptions {
    const req = scrapeRequestSchema.parse(body);
    const url = normalizeUrl(req.url).toString();
    const engine = req.fastMode === false ? 'rendered' : req.engine;
    return { url, mode: req.mode, engine, fields: req.fields, rowSelector: req.rowSelector };
}

export interface JobOutcome {
    job: Job;
    result?: ScrapeResult;
    error?: string;
    limit: LimitResult;
}

/** Validates, rate-limits, records and runs one scrape. Never throws for scrape failures — they become failed jobs. */
export async function runJob(viewer: Pick<Viewer, 'id'>, options: ScrapeOptions, skipLimit = false): Promise<JobOutcome> {
    const limit = skipLimit ? { allowed: true, limit: 0, remaining: 0, retryAfter: 0 } : take(`scrape:${viewer.id}`, scrapeRules());
    if (!limit.allowed) throw new RateLimitedError(limit);

    const store = getStore();
    const job = await store.createJob(viewer.id, options);
    const log = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => store.log(job.id, message, type).catch(() => undefined);

    try {
        const { result, pdf } = await runScrape(options, log);
        if (pdf && (await store.putFile(job.id, 'snapshot.pdf', pdf, 'application/pdf'))) {
            result.pdfUrl = `/api/v2/jobs/${job.id}/files/snapshot.pdf`;
        }
        await store.completeJob(job, result);
        return { job: { ...job, status: 'completed' }, result, limit };
    } catch (e) {
        const message = e instanceof ScrapeError ? e.message : `Scrape failed: ${(e as Error).message}`;
        await log(message, 'error');
        await store.failJob(job, message).catch(() => undefined);
        return { job: { ...job, status: 'failed', error: message }, error: message, limit };
    }
}
