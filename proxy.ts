import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/login', '/signup', '/forgot-password', '/reset-password', '/docs', '/setup', '/offline', '/auth'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const enabled = !!(supabaseUrl?.startsWith('http') && anonKey && process.env.WEBSCRAPEX_LOCAL_MODE !== 'true');

/**
 * Refreshes the Supabase session cookie on every page request and sends
 * signed-out visitors to /login. API routes do their own auth (JSON 401s).
 */
export async function proxy(req: NextRequest) {
    if (!enabled) return NextResponse.next();

    let res = NextResponse.next({ request: req });
    const supabase = createServerClient(supabaseUrl!, anonKey!, {
        cookies: {
            getAll: () => req.cookies.getAll(),
            setAll(list) {
                list.forEach(({ name, value }) => req.cookies.set(name, value));
                res = NextResponse.next({ request: req });
                list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
            },
        },
    });

    const { data } = await supabase.auth.getUser();
    const path = req.nextUrl.pathname;
    const isPublic = PUBLIC.some((p) => path === p || path.startsWith(`${p}/`));

    if (!data.user && !isPublic) {
        const login = req.nextUrl.clone();
        login.pathname = '/login';
        login.search = path === '/' ? '' : `?next=${encodeURIComponent(path + req.nextUrl.search)}`;
        return NextResponse.redirect(login);
    }
    if (data.user && (path === '/login' || path === '/signup')) {
        return NextResponse.redirect(new URL('/', req.url));
    }
    return res;
}

export const config = {
    matcher: ['/((?!api/|_next/|sw.js|swe-worker|manifest.webmanifest|icons/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|svg|webp|ico|txt|xml)$).*)'],
};
