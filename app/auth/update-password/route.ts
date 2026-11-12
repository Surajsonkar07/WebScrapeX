import { NextResponse } from 'next/server';

/** v1 password-reset emails pointed here; forward them to the new flow. */
export function GET(request: Request) {
    const url = new URL(request.url);
    const target = new URL('/auth/callback', url.origin);
    url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
    target.searchParams.set('next', '/reset-password');
    return NextResponse.redirect(target);
}
