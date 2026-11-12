import { timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import { apiError, json } from '@/lib/http';
import { runDueSchedules } from '@/lib/schedules';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Call from any cron (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
 * Runs up to three due schedules per call.
 */
export async function GET(req: Request) {
    if (!env.cronSecret) return json({ error: 'Set CRON_SECRET to enable scheduled scrapes.', code: 'not_configured' }, 503);
    const given = Buffer.from(req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '');
    const expected = Buffer.from(env.cronSecret);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return json({ error: 'Unauthorized' }, 401);
    try {
        const ran = await runDueSchedules(3);
        return json({ ran: ran.length, results: ran });
    } catch (e) {
        return apiError(e);
    }
}
