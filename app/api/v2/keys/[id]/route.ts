import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        if (viewer.via === 'apikey') return json({ error: 'Revoke keys from the dashboard.', code: 'forbidden' }, 403);
        const { id } = await params;
        return (await getStore().deleteKey(viewer.id, id)) ? json({ deleted: true }) : json({ error: 'Key not found' }, 404);
    } catch (e) {
        return apiError(e);
    }
}
