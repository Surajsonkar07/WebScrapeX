import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { getViewer, hashKey } from '@/lib/auth';
import { apiError, json, unauthorized } from '@/lib/http';
import { getStore } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        return json({ keys: await getStore().listKeys(viewer.id) });
    } catch (e) {
        return apiError(e);
    }
}

/** Creates a key. The full key is returned once; only its SHA-256 hash is stored. */
export async function POST(req: Request) {
    try {
        const viewer = await getViewer();
        if (!viewer) return unauthorized();
        if (viewer.via === 'apikey') return json({ error: 'Create keys from the dashboard, not with another key.', code: 'forbidden' }, 403);
        const { name } = z.object({ name: z.string().trim().min(1).max(60).default('Default') }).parse(await req.json().catch(() => ({})));
        const existing = await getStore().listKeys(viewer.id);
        if (existing.length >= 10) return json({ error: 'You can have at most 10 keys. Revoke one first.', code: 'limit' }, 400);
        const secret = `wsx_${randomBytes(24).toString('base64url')}`;
        const key = await getStore().createKey(viewer.id, name, secret.slice(0, 10), hashKey(secret));
        return json({ key, secret }, 201);
    } catch (e) {
        return apiError(e);
    }
}
