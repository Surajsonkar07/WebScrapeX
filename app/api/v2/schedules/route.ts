import { z } from 'zod';
import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { parseScrapeRequest } from '@/lib/scrape/run-job';
import { getStore, nextRun } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        return json({ schedules: await getStore().listSchedules(viewer.id) });
    } catch (e) {
        return apiError(e);
    }
}

const extra = z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    webhookUrl: z
        .string()
        .trim()
        .url('Webhook must be a full https:// URL')
        .refine((u) => u.startsWith('https://'), 'Webhook must use https')
        .optional()
        .or(z.literal('').transform(() => undefined)),
});

export async function POST(req: Request) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const raw = await req.json().catch(() => ({}));
        const { url, ...options } = parseScrapeRequest(raw);
        const { frequency, webhookUrl } = extra.parse(raw);
        const store = getStore();
        if ((await store.listSchedules(viewer.id)).length >= 20) return json({ error: 'You can keep up to 20 schedules.', code: 'limit' }, 400);
        const schedule = await store.createSchedule({
            userId: viewer.id,
            url,
            options,
            frequency,
            webhookUrl: webhookUrl ?? null,
            active: true,
            nextRunAt: nextRun(frequency),
        });
        return json({ schedule }, 201);
    } catch (e) {
        return apiError(e);
    }
}
