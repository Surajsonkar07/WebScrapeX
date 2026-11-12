import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { limitHeaders } from '@/lib/scrape/rate-limit';
import { parseScrapeRequest, RateLimitedError, runJob } from '@/lib/scrape/run-job';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export function GET() {
    return json({
        status: 'ok',
        usage: 'POST { url, mode?: full|content|social|design|custom, engine?: static|rendered, fields?: [{ name, selector, attribute }], rowSelector? }',
    });
}

export async function POST(req: Request) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const options = parseScrapeRequest(await req.json().catch(() => ({})));
        const outcome = await runJob(viewer, options);
        const body = {
            id: outcome.job.id,
            status: outcome.job.status,
            error: outcome.error,
            code: outcome.errorCode,
            resultUrl: `/result/${outcome.job.id}`,
            summary: outcome.result
                ? {
                      title: outcome.result.metadata.title,
                      httpStatus: outcome.result.fetch.status,
                      durationMs: outcome.result.fetch.durationMs,
                      rows: outcome.result.fields?.rows.length ?? null,
                      warnings: outcome.result.warnings,
                  }
                : undefined,
            message: outcome.error ? undefined : 'Scrape completed',
        };
        // Failed scrapes are still recorded as jobs, so the body always carries the job id.
        return json(body, { status: outcome.error ? (outcome.errorStatus ?? 422) : 200, headers: limitHeaders(outcome.limit) });
    } catch (e) {
        if (e instanceof RateLimitedError) {
            return json({ error: e.message, code: 'rate_limited', retryAfter: e.limit.retryAfter }, { status: 429, headers: limitHeaders(e.limit) });
        }
        return apiError(e);
    }
}
