import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { limitHeaders } from '@/lib/scrape/rate-limit';
import { RateLimitedError, runJob } from '@/lib/scrape/run-job';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** "Run now": same as a manual scrape (counts against your rate limit). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const { id } = await params;
        const store = getStore();
        const s = (await store.listSchedules(viewer.id)).find((x) => x.id === id);
        if (!s) return json({ error: 'Schedule not found' }, 404);
        const outcome = await runJob(viewer, { url: s.url, ...s.options });
        await store.markScheduleRun(s.id, outcome.job.id, s.nextRunAt);
        return json({ id: outcome.job.id, status: outcome.job.status, error: outcome.error }, { headers: limitHeaders(outcome.limit) });
    } catch (e) {
        if (e instanceof RateLimitedError) return json({ error: e.message, code: 'rate_limited' }, { status: 429, headers: limitHeaders(e.limit) });
        return apiError(e);
    }
}
