import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** v1 endpoint kept for existing integrations: GET ?id= returns the stored result. */
export async function GET(req: Request) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const id = new URL(req.url).searchParams.get('id');
        if (!id) return json({ error: 'ID is required' }, 400);
        const result = await getStore().getResult(viewer.id, id);
        return result ? json(result, { headers: { 'Cache-Control': 'private, max-age=300' } }) : json({ error: 'Content not found' }, 404);
    } catch (e) {
        return apiError(e);
    }
}
