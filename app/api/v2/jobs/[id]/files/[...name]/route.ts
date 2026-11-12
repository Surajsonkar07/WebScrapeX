import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; name: string[] }> }) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const { id, name } = await params;
        const file = await getStore().getFile(viewer.id, id, name.join('/'));
        if (!file) return json({ error: 'File not found', code: 'not_found' }, 404);
        return new Response(new Uint8Array(file.body), {
            headers: {
                'Content-Type': file.contentType,
                'Cache-Control': 'private, max-age=3600',
                // Scraped files are untrusted: never let them run script on this origin.
                'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (e) {
        return apiError(e);
    }
}
