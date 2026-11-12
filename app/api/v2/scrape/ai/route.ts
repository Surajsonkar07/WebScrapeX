import { z } from 'zod';
import { extractWithAI } from '@/lib/ai-extractor';
import { getViewer } from '@/lib/auth';
import { env } from '@/lib/env';
import { apiError, json, unauthorized } from '@/lib/http';
import { limitHeaders, politeSlot, take } from '@/lib/scrape/rate-limit';
import { checkRobots } from '@/lib/scrape/robots';
import { normalizeUrl, safeFetchText, ScrapeError } from '@/lib/scrape/safe-fetch';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const body = z.object({ url: z.string().min(3).max(2048), prompt: z.string().trim().min(4, 'Describe what to extract').max(1000) });

export async function POST(req: Request) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        if (!env.googleAiKey) {
            return json({ error: 'AI extraction is not set up. Add GOOGLE_AI_API_KEY to the server environment.', code: 'not_configured' }, 503);
        }
        const limit = take(`ai:${viewer.id}`, [{ limit: 5, windowMs: 60_000 }, { limit: 40, windowMs: 3_600_000 }]);
        if (!limit.allowed) {
            return json({ error: `AI extraction is limited to 5 requests per minute. Try again in ${limit.retryAfter} s.`, code: 'rate_limited' }, { status: 429, headers: limitHeaders(limit) });
        }

        const input = body.parse(await req.json());
        const url = normalizeUrl(input.url);
        const robots = await checkRobots(url);
        if (!robots.allowed) throw new ScrapeError(`robots.txt does not allow fetching this page (${robots.matchedRule ?? 'Disallow'}).`, 'robots', 403);
        if (!(await politeSlot(url.host, Math.max(1000, (robots.crawlDelay ?? 0) * 1000)))) {
            throw new ScrapeError(`Too many requests to ${url.host} right now.`, 'busy', 429);
        }
        const page = await safeFetchText(url);
        if (page.status >= 400) throw new ScrapeError(`${url.host} answered HTTP ${page.status}.`, 'http', 502);

        const started = Date.now();
        const data = await extractWithAI(page.body, input.prompt, page.finalUrl);
        return json({ success: true, data, url: page.finalUrl, prompt: input.prompt, model: env.geminiModel, durationMs: Date.now() - started }, { headers: limitHeaders(limit) });
    } catch (e) {
        return apiError(e);
    }
}
