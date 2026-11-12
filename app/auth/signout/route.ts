import { NextResponse } from 'next/server';
import { supabaseEnabled } from '@/lib/env';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
    if (supabaseEnabled) {
        const supabase = await createSupabaseServer();
        await supabase.auth.signOut();
    }
    return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
