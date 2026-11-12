import 'server-only';

/**
 * Sliding-window limiter kept in process memory. Good for a single server or
 * one serverless instance; put a shared store (Redis/Upstash) behind the same
 * interface when running many instances.
 */
type Window = { hits: number[] };

const buckets = new Map<string, Window>();
let lastSweep = Date.now();

function sweep(now: number) {
    if (now - lastSweep < 60_000) return;
    lastSweep = now;
    for (const [key, w] of buckets) {
        if (!w.hits.length || now - w.hits[w.hits.length - 1] > 3_600_000) buckets.delete(key);
    }
}

export interface LimitRule {
    limit: number;
    windowMs: number;
}

export interface LimitResult {
    allowed: boolean;
    limit: number;
    /** Window of the rule that decided the result. */
    windowMs?: number;
    remaining: number;
    /** Seconds until the next request is allowed. */
    retryAfter: number;
}

/** Checks every rule; records the hit only when all of them allow it. */
export function take(key: string, rules: LimitRule[]): LimitResult {
    const now = Date.now();
    sweep(now);
    const w = buckets.get(key) ?? { hits: [] };
    const longest = Math.max(...rules.map((r) => r.windowMs));
    w.hits = w.hits.filter((t) => now - t < longest);

    const states = rules.map((rule) => {
        const inWindow = w.hits.filter((t) => now - t < rule.windowMs);
        return {
            rule,
            remaining: rule.limit - inWindow.length,
            retryAfter: inWindow.length ? Math.ceil((inWindow[0] + rule.windowMs - now) / 1000) : 0,
        };
    });

    const blocked = states.filter((s) => s.remaining <= 0);
    if (blocked.length) {
        const worst = blocked.reduce((a, b) => (b.retryAfter > a.retryAfter ? b : a));
        buckets.set(key, w);
        return { allowed: false, limit: worst.rule.limit, windowMs: worst.rule.windowMs, remaining: 0, retryAfter: Math.max(1, worst.retryAfter) };
    }

    w.hits.push(now);
    buckets.set(key, w);
    const tightest = states.reduce((a, b) => (b.remaining < a.remaining ? b : a));
    return { allowed: true, limit: tightest.rule.limit, remaining: tightest.remaining - 1, retryAfter: 0 };
}

/** Read-only view used by the preflight panel. */
export function peek(key: string, rule: LimitRule): { used: number; limit: number } {
    const now = Date.now();
    const w = buckets.get(key);
    const used = w ? w.hits.filter((t) => now - t < rule.windowMs).length : 0;
    return { used, limit: rule.limit };
}

export function limitHeaders(r: LimitResult): Record<string, string> {
    const h: Record<string, string> = {
        'X-RateLimit-Limit': String(r.limit),
        'X-RateLimit-Remaining': String(r.remaining),
    };
    if (!r.allowed) h['Retry-After'] = String(r.retryAfter);
    return h;
}

/* ---------- per-target-host politeness ---------- */

const hostNext = new Map<string, number>();

/**
 * Spaces requests to the same host by at least `gapMs` (robots.txt crawl-delay
 * or 1 s). Waits up to `maxWaitMs`; returns false if the wait would be longer.
 */
export async function politeSlot(host: string, gapMs: number, maxWaitMs = 8000): Promise<boolean> {
    const now = Date.now();
    const next = hostNext.get(host) ?? 0;
    const wait = Math.max(0, next - now);
    if (wait > maxWaitMs) return false;
    hostNext.set(host, Math.max(now, next) + gapMs);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return true;
}
