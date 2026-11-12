import { env, supabaseEnabled } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const started = Date.now();
    const checks: Record<string, 'ok' | 'error' | 'skipped'> = { app: 'ok', database: 'skipped', storage: 'skipped' };

    const admin = supabaseAdmin();
    if (supabaseEnabled && admin) {
        const [db, storage] = await Promise.all([
            admin.from('websites').select('id', { head: true, count: 'exact' }).limit(1),
            admin.storage.from('scrapes').list('', { limit: 1 }),
        ]);
        checks.database = db.error ? 'error' : 'ok';
        checks.storage = storage.error ? 'error' : 'ok';
    }

    const healthy = !Object.values(checks).includes('error');
    return Response.json(
        {
            status: healthy ? 'healthy' : 'degraded',
            mode: supabaseEnabled ? 'supabase' : 'local',
            checks,
            features: { ai: !!env.googleAiKey, schedules: !!env.cronSecret, renderedEngine: !!(env.browserWs || env.chromePath) || !env.isServerless },
            responseTimeMs: Date.now() - started,
            timestamp: new Date().toISOString(),
        },
        { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    );
}
