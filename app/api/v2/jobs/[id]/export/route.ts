import { getViewer } from '@/lib/auth';
import { datasetsFor, exportFileName, toCsv, toJson } from '@/lib/export';
import { apiError, json, unauthorized } from '@/lib/http';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const { id } = await params;
        const result = await getStore().getResult(viewer.id, id);
        if (!result) return json({ error: 'Result not found', code: 'not_found' }, 404);

        const p = new URL(req.url).searchParams;
        const format = p.get('format') === 'csv' ? 'csv' : 'json';

        if (format === 'json') {
            return new Response(toJson(result, p.get('full') === '1'), {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${exportFileName(result, 'result', 'json')}"`,
                },
            });
        }

        const sets = datasetsFor(result);
        const wanted = p.get('dataset') ?? sets[0].id;
        const set = sets.find((s) => s.id === wanted);
        if (!set) {
            return json({ error: `Unknown dataset "${wanted}". Available: ${sets.map((s) => s.id).join(', ')}`, code: 'invalid_request' }, 400);
        }
        return new Response(toCsv(set), {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${exportFileName(result, set.id.replace(':', '-'), 'csv')}"`,
            },
        });
    } catch (e) {
        return apiError(e);
    }
}
