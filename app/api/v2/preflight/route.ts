import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { limitHeaders, peek, take } from '@/lib/scrape/rate-limit';
import { checkRobots } from '@/lib/scrape/robots';
import { scrapeRules } from '@/lib/scrape/run-job';
import { assertPublicHost, normalizeUrl } from '@/lib/scrape/safe-fetch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cheap check the console runs while you type: is the URL valid, public and allowed by robots.txt? */
export async function GET(req: Request) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const limit = take(`preflight:${viewer.id}`, [{ limit: 40, windowMs: 60_000 }]);
        if (!limit.allowed) return json({ error: 'Slow down a little.', code: 'rate_limited' }, { status: 429, headers: limitHeaders(limit) });

        const url = normalizeUrl(new URL(req.url).searchParams.get('url') ?? '');
        await assertPublicHost(url);
        const robots = await checkRobots(url);
        const [minute, hour] = scrapeRules();
        return json({
            url: url.toString(),
            host: url.host,
            robots,
            quota: { minute: peek(`scrape:${viewer.id}`, minute), hour: peek(`scrape:${viewer.id}`, hour) },
        });
    } catch (e) {
        return apiError(e);
    }
}
