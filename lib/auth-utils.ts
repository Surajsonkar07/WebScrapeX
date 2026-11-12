import 'server-only';
import crypto from 'node:crypto';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/server';

/** Stable pseudo-id for an email before the auth user exists (keys verification_tokens). */
export function emailToUuid(email: string): string {
    const hash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

export async function isEmailAlreadyRegistered(email: string): Promise<boolean> {
    const admin = supabaseAdmin();
    if (!admin) return false;
    const clean = email.toLowerCase().trim();
    const { data: profile } = await admin.from('profiles').select('id').eq('email', clean).maybeSingle();
    if (profile) return true;
    for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error || !data?.users.length) break;
        if (data.users.some((u) => u.email?.toLowerCase() === clean)) return true;
        if (data.users.length < 1000) break;
    }
    return false;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendMailjetOtp(email: string, fullName: string, code: string): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
    if (!env.mailjetKey || !env.mailjetSecret) {
        if (process.env.NODE_ENV === 'production') {
            return { success: false, error: 'Email delivery is not set up (MAILJET_API_KEY / MAILJET_SECRET_KEY).' };
        }
        console.warn(`[dev] Mailjet is not configured. Sign-up code for ${email}: ${code}`);
        return { success: true, simulated: true };
    }

    const res = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${env.mailjetKey}:${env.mailjetSecret}`).toString('base64')}`,
        },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
            Messages: [
                {
                    From: { Email: env.mailjetSender ?? 'noreply@webscrape-x.com', Name: 'WebScrapeX' },
                    To: [{ Email: email, Name: fullName || 'there' }],
                    Subject: `${code} is your WebScrapeX code`,
                    TextPart: `Your WebScrapeX verification code is ${code}. It expires in 15 minutes.`,
                    HTMLPart: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:28px;background:#f7f5f0;color:#1d1f24;border-radius:10px;border:1px solid #e3ded3">
<p style="margin:0 0 4px;font:600 13px ui-monospace,monospace;letter-spacing:.08em;color:#b2501f">WEBSCRAPEX</p>
<h1 style="margin:0 0 12px;font-size:20px">Hi ${escapeHtml(fullName || 'there')}, here is your sign-up code</h1>
<p style="margin:0 0 20px;color:#555">Enter it on the sign-up page to finish creating your account.</p>
<p style="margin:0 0 20px;padding:16px;text-align:center;background:#fff;border:1px solid #e3ded3;border-radius:8px;font:700 32px ui-monospace,monospace;letter-spacing:10px">${code}</p>
<p style="margin:0;color:#777;font-size:13px">The code expires in 15 minutes. If you did not ask for it, ignore this email.</p></div>`,
                },
            ],
        }),
    }).catch((e: Error) => ({ ok: false, status: 0, text: async () => e.message }) as unknown as Response);

    if (!res.ok) {
        console.error('Mailjet error', res.status);
        return { success: false, error: `Could not send the email (Mailjet ${res.status || 'unreachable'}).` };
    }
    return { success: true };
}
