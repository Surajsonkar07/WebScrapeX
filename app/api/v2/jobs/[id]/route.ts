import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const { id } = await params;
        const store = getStore();
        const job = await store.getJob(viewer.id, id);
        if (!job) return json({ error: 'Job not found', code: 'not_found' }, 404);
        const [result, logs] = await Promise.all([store.getResult(viewer.id, id), store.getLogs(viewer.id, id)]);
        return json({ job, result, logs });
    } catch (e) {
        return apiError(e);
    }
}

export async function DELETE(_req: Request, { params }: Ctx) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const { id } = await params;
        const ok = await getStore().deleteJob(viewer.id, id);
        return ok ? json({ deleted: true }) : json({ error: 'Job not found', code: 'not_found' }, 404);
    } catch (e) {
        return apiError(e);
    }
}
