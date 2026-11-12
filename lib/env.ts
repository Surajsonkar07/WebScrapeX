import 'server-only';

/**
 * Server-side configuration. Only reports whether values exist — never their contents.
 */
const str = (v: string | undefined) => (v && v.trim().length > 0 ? v.trim() : undefined);
const int = (v: string | undefined, fallback: number) => {
    const n = Number.parseInt(v ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

const supabaseUrl = str(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = str(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const forceLocal = process.env.WEBSCRAPEX_LOCAL_MODE === 'true';

export const env = {
    supabaseUrl: supabaseUrl?.startsWith('http') ? supabaseUrl : undefined,
    supabaseAnonKey,
    serviceRoleKey: str(process.env.SUPABASE_SERVICE_ROLE_KEY),
    googleAiKey: str(process.env.GOOGLE_AI_API_KEY),
    geminiModel: str(process.env.GEMINI_MODEL) ?? 'gemini-2.5-flash',
    mailjetKey: str(process.env.MAILJET_API_KEY),
    mailjetSecret: str(process.env.MAILJET_SECRET_KEY),
    mailjetSender: str(process.env.MAILJET_SENDER_EMAIL),
    cronSecret: str(process.env.CRON_SECRET),
    browserWs: str(process.env.BROWSER_WS_ENDPOINT),
    chromePath: str(process.env.CHROME_EXECUTABLE_PATH),
    chromiumPack: str(process.env.CHROMIUM_PACK_URL),
    proxyUrl: str(process.env.PROXY_URL),
    userAgent:
        str(process.env.SCRAPER_USER_AGENT) ??
        'WebScrapeXBot/2.0 (+https://github.com/webscrapex; respects robots.txt)',
    adminEmails: (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    allowPrivateHosts: process.env.ALLOW_PRIVATE_HOSTS === 'true',
    perMinute: int(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 10),
    perHour: int(process.env.RATE_LIMIT_REQUESTS_PER_HOUR, 100),
    timeoutMs: int(process.env.SCRAPE_TIMEOUT_MS, 20000),
    isServerless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.NETLIFY),
    forceLocal,
};

/** Supabase is used when both public values exist and local mode is not forced. */
export const supabaseEnabled = !!(env.supabaseUrl && env.supabaseAnonKey && !forceLocal);

/**
 * Single-user local mode (no sign-in). Automatic in development; in production
 * it must be switched on explicitly, so a deploy with missing keys never
 * becomes an open, unauthenticated scraper.
 */
export const localModeAllowed = !supabaseEnabled && (process.env.NODE_ENV !== 'production' || forceLocal);

export type AppMode = 'supabase' | 'local' | 'unconfigured';
export const appMode: AppMode = supabaseEnabled ? 'supabase' : localModeAllowed ? 'local' : 'unconfigured';

export type SetupItem = { name: string; ok: boolean; required: boolean; purpose: string };

export function setupStatus(): { mode: AppMode; items: SetupItem[] } {
    return {
        mode: appMode,
        items: [
            { name: 'NEXT_PUBLIC_SUPABASE_URL', ok: !!env.supabaseUrl, required: true, purpose: 'Accounts, job history and storage' },
            { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', ok: !!env.supabaseAnonKey, required: true, purpose: 'Browser sign-in and row-level security' },
            { name: 'SUPABASE_SERVICE_ROLE_KEY', ok: !!env.serviceRoleKey, required: true, purpose: 'Sign-up, API keys, schedules and asset uploads' },
            { name: 'MAILJET_API_KEY', ok: !!env.mailjetKey, required: false, purpose: 'Sends the 6-digit sign-up code' },
            { name: 'MAILJET_SECRET_KEY', ok: !!env.mailjetSecret, required: false, purpose: 'Sends the 6-digit sign-up code' },
            { name: 'GOOGLE_AI_API_KEY', ok: !!env.googleAiKey, required: false, purpose: 'AI extraction with Gemini' },
            { name: 'CRON_SECRET', ok: !!env.cronSecret, required: false, purpose: 'Protects the scheduled-scrape endpoint' },
            { name: 'ADMIN_EMAILS', ok: env.adminEmails.length > 0, required: false, purpose: 'Who can open the admin console' },
            { name: 'BROWSER_WS_ENDPOINT / CHROME_EXECUTABLE_PATH', ok: !!(env.browserWs || env.chromePath), required: false, purpose: 'Rendered (JavaScript) engine; auto-detects local Chrome' },
        ],
    };
}
