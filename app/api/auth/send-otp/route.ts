import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { emailToUuid, isEmailAlreadyRegistered, sendMailjetOtp } from '@/lib/auth-utils';
import { supabaseEnabled } from '@/lib/env';
import { apiError, json } from '@/lib/http';
import { limitHeaders, take } from '@/lib/scrape/rate-limit';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const body = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address'), fullName: z.string().trim().max(80).optional() });

export async function POST(req: Request) {
    try {
        if (!supabaseEnabled) return json({ error: 'Accounts are off: Supabase is not configured.', code: 'not_configured' }, 503);
        const admin = supabaseAdmin();
        if (!admin) return json({ error: 'Sign-up needs SUPABASE_SERVICE_ROLE_KEY on the server.', code: 'not_configured' }, 503);

        const { email, fullName } = body.parse(await req.json());
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
        const limit = take(`otp:${email}:${ip}`, [{ limit: 3, windowMs: 10 * 60_000 }]);
        if (!limit.allowed) {
            return json({ error: `Too many codes requested. Wait ${Math.ceil(limit.retryAfter / 60)} min and try again.`, code: 'rate_limited' }, { status: 429, headers: limitHeaders(limit) });
        }

        if (await isEmailAlreadyRegistered(email)) {
            return json({ error: 'This email already has an account. Sign in instead.', code: 'exists' }, 409);
        }

        const code = String(randomInt(100000, 1000000));
        const userId = emailToUuid(email);
        await admin.from('verification_tokens').delete().eq('user_id', userId);
        const { error } = await admin.from('verification_tokens').insert({ user_id: userId, token: code, expires_at: new Date(Date.now() + 15 * 60_000).toISOString() });
        if (error) return json({ error: 'Could not store the verification code.', code: 'server_error' }, 500);

        const mail = await sendMailjetOtp(email, fullName ?? '', code);
        if (!mail.success) return json({ error: mail.error, code: 'mail_failed' }, 502);
        return json({ success: true, simulated: mail.simulated ?? false, message: mail.simulated ? 'Email is not configured; the code was written to the server log.' : 'Code sent. Check your inbox.' });
    } catch (e) {
        return apiError(e);
    }
}
