import { z } from 'zod';
import { emailToUuid } from '@/lib/auth-utils';
import { apiError, json } from '@/lib/http';
import { take } from '@/lib/scrape/rate-limit';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const body = z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d{6}$/, 'The code has 6 digits'),
    password: z.string().min(8, 'Use at least 8 characters').max(128),
    fullName: z.string().trim().max(80).optional(),
});

/** Verifies the 6-digit code, then creates the confirmed Supabase user. No user exists before this succeeds. */
export async function POST(req: Request) {
    try {
        const admin = supabaseAdmin();
        if (!admin) return json({ error: 'Sign-up needs SUPABASE_SERVICE_ROLE_KEY on the server.', code: 'not_configured' }, 503);
        const { email, code, password, fullName } = body.parse(await req.json());

        const limit = take(`verify:${email}`, [{ limit: 8, windowMs: 15 * 60_000 }]);
        if (!limit.allowed) return json({ error: 'Too many attempts. Request a new code in a few minutes.', code: 'rate_limited' }, 429);

        const userId = emailToUuid(email);
        const { data: token } = await admin.from('verification_tokens').select('id,expires_at').eq('user_id', userId).eq('token', code).maybeSingle();
        if (!token) return json({ error: 'That code is not right. Check the email or request a new one.', code: 'invalid_code' }, 400);
        if (Date.now() > Date.parse((token as { expires_at: string }).expires_at)) {
            await admin.from('verification_tokens').delete().eq('user_id', userId);
            return json({ error: 'The code has expired. Request a new one.', code: 'expired' }, 400);
        }

        const { data: created, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName ?? null } });
        if (error || !created.user) return json({ error: error?.message ?? 'Could not create the account.', code: 'create_failed' }, 400);

        await admin.from('profiles').upsert({ id: created.user.id, full_name: fullName ?? null, email, verified: true, updated_at: new Date().toISOString() });
        await admin.from('verification_tokens').delete().eq('user_id', userId);
        return json({ success: true, user: { id: created.user.id, email } });
    } catch (e) {
        return apiError(e);
    }
}
