import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { getStore, type JobStatus } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES: JobStatus[] = ['pending', 'scraping', 'completed', 'failed'];

export async function GET(req: Request) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const p = new URL(req.url).searchParams;
        const limit = Math.min(100, Math.max(1, Number(p.get('limit')) || 25));
        const offset = Math.max(0, Number(p.get('offset')) || 0);
        const status = STATUSES.find((s) => s === p.get('status'));
        const data = await getStore().listJobs(viewer.id, { limit, offset, search: p.get('q') ?? undefined, status });
        return json(data);
    } catch (e) {
        return apiError(e);
    }
}
