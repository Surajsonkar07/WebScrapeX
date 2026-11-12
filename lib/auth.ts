import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { env, localModeAllowed, supabaseEnabled } from '@/lib/env';
import { createSupabaseServer, supabaseAnon } from '@/lib/supabase/server';
import { getStore } from '@/lib/store';

export interface Viewer {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
    via: 'session' | 'apikey' | 'local';
}

export const LOCAL_VIEWER: Viewer = { id: 'local', email: 'you@localhost', name: 'Local workspace', isAdmin: true, via: 'local' };

export const hashKey = (key: string) => createHash('sha256').update(key).digest('hex');

const isAdmin = (email: string | null | undefined) => !!email && env.adminEmails.includes(email.toLowerCase());

/**
 * Who is calling: a cookie session, an `Authorization: Bearer wsx_…` API key,
 * a Supabase access token, or the single local user when Supabase is off.
 */
export async function getViewer(): Promise<Viewer | null> {
    if (!supabaseEnabled) {
        return localModeAllowed ? LOCAL_VIEWER : null;
    }

    const auth = (await headers()).get('authorization');
    const token = auth?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

    if (token?.startsWith('wsx_')) {
        const hit = await getStore().resolveKey(hashKey(token));
        return hit ? { id: hit.userId, email: hit.email ?? '', name: null, isAdmin: false, via: 'apikey' } : null;
    }

    if (token) {
        const { data } = await supabaseAnon().auth.getUser(token);
        if (data.user) {
            return { id: data.user.id, email: data.user.email ?? '', name: (data.user.user_metadata?.full_name as string) ?? null, isAdmin: isAdmin(data.user.email), via: 'apikey' };
        }
        return null;
    }

    const supabase = await createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
        id: data.user.id,
        email: data.user.email ?? '',
        name: (data.user.user_metadata?.full_name as string) ?? null,
        isAdmin: isAdmin(data.user.email),
        via: 'session',
    };
}
