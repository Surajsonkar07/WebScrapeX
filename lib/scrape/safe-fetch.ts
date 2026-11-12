import 'server-only';
import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { env } from '@/lib/env';

export class ScrapeError extends Error {
    constructor(
        message: string,
        public code: 'invalid_url' | 'invalid_request' | 'blocked_host' | 'robots' | 'http' | 'timeout' | 'too_large' | 'not_html' | 'busy' | 'network',
        public status = 400,
    ) {
        super(message);
    }
}

/** Accepts `example.com/page` as well as full URLs; only http(s). */
export function normalizeUrl(input: string): URL {
    const raw = input.trim();
    if (!raw) throw new ScrapeError('Enter a URL to scrape.', 'invalid_url');
    let url: URL;
    try {
        url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
        throw new ScrapeError(`“${raw}” is not a valid URL.`, 'invalid_url');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new ScrapeError('Only http and https URLs can be scraped.', 'invalid_url');
    }
    if (url.username || url.password) {
        throw new ScrapeError('URLs with embedded credentials are not accepted.', 'invalid_url');
    }
    url.hash = '';
    return url;
}

function isPrivateIp(ip: string): boolean {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number);
        return (
            a === 0 || a === 10 || a === 127 ||
            (a === 100 && b >= 64 && b <= 127) ||
            (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            (a === 198 && (b === 18 || b === 19)) ||
            a >= 224
        );
    }
    const v6 = ip.toLowerCase();
    if (v6 === '::' || v6 === '::1') return true;
    if (v6.startsWith('::ffff:')) return isPrivateIp(v6.slice(7));
    return v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('ff');
}

/** Blocks localhost, private ranges and cloud metadata addresses (SSRF guard). */
export async function assertPublicHost(url: URL): Promise<void> {
    if (env.allowPrivateHosts) return;
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
        throw new ScrapeError('Private and local addresses cannot be scraped.', 'blocked_host');
    }
    let addresses: string[];
    try {
        addresses = net.isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
    } catch {
        throw new ScrapeError(`Could not resolve ${host}. Check the domain name.`, 'network', 502);
    }
    if (addresses.some(isPrivateIp)) {
        throw new ScrapeError('Private and local addresses cannot be scraped.', 'blocked_host');
    }
}

export interface FetchedText {
    finalUrl: string;
    status: number;
    contentType: string;
    body: string;
    bytes: number;
    truncated: boolean;
}

/**
 * GET with timeout, manual redirects (each hop re-checked against the SSRF
 * guard) and a byte cap.
 */
export async function safeFetchText(
    input: URL,
    opts: { timeoutMs?: number; maxBytes?: number; accept?: string; maxRedirects?: number } = {},
): Promise<FetchedText> {
    const { timeoutMs = env.timeoutMs, maxBytes = 3_000_000, accept = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', maxRedirects = 5 } = opts;
    const signal = AbortSignal.timeout(timeoutMs);
    let url = input;

    for (let hop = 0; hop <= maxRedirects; hop++) {
        await assertPublicHost(url);
        let res: Response;
        try {
            res = await fetch(url, {
                redirect: 'manual',
                signal,
                headers: { 'User-Agent': env.userAgent, Accept: accept, 'Accept-Language': 'en;q=0.9,*;q=0.5' },
            });
        } catch (e) {
            const err = e as Error;
            if (err.name === 'TimeoutError' || err.name === 'AbortError') {
                throw new ScrapeError(`${url.host} did not answer within ${Math.round(timeoutMs / 1000)} s.`, 'timeout', 504);
            }
            throw new ScrapeError(`Could not reach ${url.host}: ${err.message}`, 'network', 502);
        }

        if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
            url = new URL(res.headers.get('location')!, url);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                throw new ScrapeError('Redirected to a non-http URL.', 'invalid_url');
            }
            continue;
        }

        const reader = res.body?.getReader();
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        let truncated = false;
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                bytes += value.byteLength;
                if (bytes > maxBytes) {
                    truncated = true;
                    chunks.push(value.subarray(0, value.byteLength - (bytes - maxBytes)));
                    await reader.cancel();
                    bytes = maxBytes;
                    break;
                }
                chunks.push(value);
            }
        }
        const body = new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks));
        return {
            finalUrl: url.toString(),
            status: res.status,
            contentType: res.headers.get('content-type') ?? '',
            body,
            bytes,
            truncated,
        };
    }
    throw new ScrapeError('Too many redirects.', 'http', 508);
}
