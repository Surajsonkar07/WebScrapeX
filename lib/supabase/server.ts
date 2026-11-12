import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env, supabaseEnabled } from '@/lib/env';

/** Cookie-bound client: acts as the signed-in user (row-level security applies). */
export async function createSupabaseServer(): Promise<SupabaseClient> {
    if (!supabaseEnabled) throw new Error('Supabase is not configured');
    const cookieStore = await cookies();
    return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll(list) {
                try {
                    list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                } catch {
                    // Called from a Server Component; the proxy refreshes cookies instead.
                }
            },
        },
    });
}

let admin: SupabaseClient | null | undefined;

/** Service-role client (bypasses RLS). Server only; null when the key is missing. */
export function supabaseAdmin(): SupabaseClient | null {
    if (admin !== undefined) return admin;
    admin =
        supabaseEnabled && env.serviceRoleKey
            ? createClient(env.supabaseUrl!, env.serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
            : null;
    return admin;
}

/** Plain anon client for verifying bearer tokens. */
export function supabaseAnon(): SupabaseClient {
    return createClient(env.supabaseUrl!, env.supabaseAnonKey!, { auth: { autoRefreshToken: false, persistSession: false } });
}
