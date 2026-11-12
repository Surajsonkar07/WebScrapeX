import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getViewer } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { limitHeaders, take } from '@/lib/scrape/rate-limit';
import { checkRobots } from '@/lib/scrape/robots';
import { assertPublicHost } from '@/lib/scrape/safe-fetch';
import { env } from '@/lib/env';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const body = z.object({ id: z.string().min(1), urls: z.array(z.string().url()).max(200).optional() });

const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/avif': 'avif', 'image/svg+xml': 'svg', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico' };

/** Copies a job's images into storage (max 40, 5 MB each), honouring robots.txt per image. */
export async function POST(req: Request) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        const limit = take(`assets:${viewer.id}`, [{ limit: 5, windowMs: 60_000 }]);
        if (!limit.allowed) return json({ error: `Asset downloads are limited to 5 per minute. Try again in ${limit.retryAfter} s.`, code: 'rate_limited' }, { status: 429, headers: limitHeaders(limit) });

        const { id, urls } = body.parse(await req.json());
        const store = getStore();
        const result = await store.getResult(viewer.id, id);
        if (!result) return json({ error: 'Job not found', code: 'not_found' }, 404);

        const known = new Set((result.images ?? []).map((i) => i.url));
        const targets = (urls ?? [...known]).filter((u) => known.has(u)).slice(0, 40);
        const saved: string[] = [];
        const skipped: Array<{ url: string; reason: string }> = [];

        await Promise.all(
            targets.map(async (u) => {
                try {
                    const url = new URL(u);
                    if (!/^https?:$/.test(url.protocol)) throw new Error('not http');
                    await assertPublicHost(url);
                    const robots = await checkRobots(url);
                    if (!robots.allowed) throw new Error(`robots.txt: ${robots.matchedRule ?? 'disallowed'}`);
                    const res = await fetch(url, { headers: { 'User-Agent': env.userAgent, Referer: result.url }, signal: AbortSignal.timeout(10_000), redirect: 'error' });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
                    const ext = EXT[type];
                    if (!ext) throw new Error(`not an image (${type || 'unknown type'})`);
                    const buf = Buffer.from(await res.arrayBuffer());
                    if (buf.byteLength > 5_000_000) throw new Error('larger than 5 MB');
                    const name = `assets/${randomUUID().slice(0, 8)}-${(url.pathname.split('/').pop() || 'image').replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}.${ext}`;
                    if (await store.putFile(id, name, buf, type)) saved.push(`/api/v2/jobs/${id}/files/${name}`);
                    else throw new Error('storage rejected the file');
                } catch (e) {
                    skipped.push({ url: u, reason: (e as Error).message });
                }
            }),
        );

        await store.log(id, `Saved ${saved.length} of ${targets.length} images to storage`, saved.length ? 'success' : 'warning').catch(() => undefined);
        return json({ success: true, downloadedCount: saved.length, totalRequested: targets.length, files: saved, skipped });
    } catch (e) {
        return apiError(e);
    }
}
