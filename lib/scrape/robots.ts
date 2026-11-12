import 'server-only';
import type { RobotsVerdict } from '@/lib/scraper-types';
import { safeFetchText } from './safe-fetch';

/** Minimal RFC 9309 robots.txt parser: groups, Allow/Disallow, `*` and `$`, longest match wins. */
interface Group {
    agents: string[];
    rules: Array<{ allow: boolean; path: string }>;
    crawlDelay?: number;
}

export function parseRobots(text: string): Group[] {
    const groups: Group[] = [];
    let current: Group | null = null;
    let lastWasAgent = false;

    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.replace(/#.*$/, '').trim();
        if (!line) continue;
        const idx = line.indexOf(':');
        if (idx < 0) continue;
        const key = line.slice(0, idx).trim().toLowerCase();
        const value = line.slice(idx + 1).trim();

        if (key === 'user-agent') {
            if (!current || !lastWasAgent) {
                current = { agents: [], rules: [] };
                groups.push(current);
            }
            current.agents.push(value.toLowerCase());
            lastWasAgent = true;
            continue;
        }
        lastWasAgent = false;
        if (!current) continue;
        if (key === 'allow' || key === 'disallow') {
            if (value) current.rules.push({ allow: key === 'allow', path: value });
        } else if (key === 'crawl-delay') {
            const n = Number.parseFloat(value);
            if (Number.isFinite(n) && n >= 0) current.crawlDelay = n;
        }
    }
    return groups;
}

function ruleMatches(pattern: string, path: string): boolean {
    const anchored = pattern.endsWith('$');
    const body = anchored ? pattern.slice(0, -1) : pattern;
    const regex = new RegExp(
        '^' + body.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (anchored ? '$' : ''),
    );
    return regex.test(path);
}

export function evaluate(groups: Group[], userAgentToken: string, path: string) {
    const token = userAgentToken.toLowerCase();
    const specific = groups.filter((g) => g.agents.some((a) => a !== '*' && token.includes(a)));
    const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes('*'));
    const rules = chosen.flatMap((g) => g.rules);
    const crawlDelay = chosen.find((g) => g.crawlDelay !== undefined)?.crawlDelay;

    let best: { allow: boolean; path: string } | null = null;
    for (const r of rules) {
        if (!ruleMatches(r.path, path)) continue;
        if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
    }
    return {
        allowed: best ? best.allow : true,
        matchedRule: best ? `${best.allow ? 'Allow' : 'Disallow'}: ${best.path}` : undefined,
        crawlDelay,
    };
}

const cache = new Map<string, { at: number; groups: Group[] | 'all' | 'none'; status: RobotsVerdict['status'] }>();
const TTL = 15 * 60_000;

export async function checkRobots(url: URL, userAgentToken = 'WebScrapeXBot'): Promise<RobotsVerdict> {
    const robotsUrl = `${url.origin}/robots.txt`;
    let entry = cache.get(url.origin);

    if (!entry || Date.now() - entry.at > TTL) {
        try {
            const res = await safeFetchText(new URL(robotsUrl), { timeoutMs: 6000, maxBytes: 500_000, accept: 'text/plain,*/*;q=0.5' });
            if (res.status >= 200 && res.status < 300) {
                entry = { at: Date.now(), groups: parseRobots(res.body), status: 'found' };
            } else if (res.status >= 400 && res.status < 500) {
                entry = { at: Date.now(), groups: 'all', status: 'missing' };
            } else {
                // RFC 9309 §2.3.1.4: a server error means "assume complete disallow".
                entry = { at: Date.now(), groups: 'none', status: 'unreachable' };
            }
        } catch {
            entry = { at: Date.now(), groups: 'none', status: 'unreachable' };
        }
        cache.set(url.origin, entry);
    }

    if (entry.groups === 'all') return { allowed: true, robotsUrl, status: entry.status };
    if (entry.groups === 'none') {
        return { allowed: false, robotsUrl, status: entry.status, matchedRule: 'robots.txt could not be fetched (treated as Disallow: /)' };
    }
    const verdict = evaluate(entry.groups, userAgentToken, url.pathname + url.search);
    return { ...verdict, robotsUrl, status: entry.status };
}
