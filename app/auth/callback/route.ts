import { NextResponse } from 'next/server';
import { supabaseEnabled } from '@/lib/env';
import { createSupabaseServer } from '@/lib/supabase/server';

/** OAuth and email-link landing: exchanges the code for a session cookie. */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next');
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

    if (code && supabaseEnabled) {
        const supabase = await createSupabaseServer();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('That sign-in link is invalid or expired.')}`, url.origin));
    }
    return NextResponse.redirect(new URL(safeNext, url.origin));
}
