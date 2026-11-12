import { z } from 'zod';
import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const { id } = await params;
        const { active } = z.object({ active: z.boolean() }).parse(await req.json());
        return (await getStore().setScheduleActive(viewer.id, id, active)) ? json({ active }) : json({ error: 'Schedule not found' }, 404);
    } catch (e) {
        return apiError(e);
    }
}

export async function DELETE(_req: Request, { params }: Ctx) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const { id } = await params;
        return (await getStore().deleteSchedule(viewer.id, id)) ? json({ deleted: true }) : json({ error: 'Schedule not found' }, 404);
    } catch (e) {
        return apiError(e);
    }
}
