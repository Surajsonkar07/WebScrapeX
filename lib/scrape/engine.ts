import 'server-only';
import * as cheerio from 'cheerio';
import { env } from '@/lib/env';
import type { ScrapeOptions, ScrapeResult } from '@/lib/scraper-types';
import { extractMetadata } from '@/lib/extractors/meta';
import { extractColors } from '@/lib/extractors/colors';
import { extractFonts } from '@/lib/extractors/fonts';
import { detectTechnologies } from '@/lib/extractors/tech';
import { extractContent } from '@/lib/extractors/content';
import { extractSocialData } from '@/lib/extractors/social';
import { extractLinkedInProfile } from '@/lib/extractors/linkedin';
import { auditSEO } from '@/lib/extractors/seo';
import { checkRobots } from './robots';
import { politeSlot } from './rate-limit';
import { normalizeUrl, safeFetchText, ScrapeError } from './safe-fetch';
import { extractTables, runFieldSelectors } from './selectors';
import { renderPage } from './browser';

export type LogFn = (message: string, type?: 'info' | 'success' | 'warning' | 'error') => Promise<void>;

const SOCIAL_HOSTS = /(facebook|twitter|x\.com|linkedin|instagram|youtube|github|tiktok|threads|mastodon)\./i;

export interface EngineOutput {
    result: ScrapeResult;
    pdf?: Buffer;
}

export async function runScrape(input: ScrapeOptions, log: LogFn): Promise<EngineOutput> {
    const started = Date.now();
    const url = normalizeUrl(input.url);
    const warnings: string[] = [];
    const { mode } = input;
    const fields = input.fields.filter((f) => f.name.trim() && (f.selector.trim() || input.rowSelector?.trim()));

    if (mode === 'custom' && fields.length === 0) {
        throw new ScrapeError('Custom mode needs at least one field with a name and a CSS selector.', 'invalid_url');
    }

    // 1. robots.txt
    await log(`Checking ${url.origin}/robots.txt`);
    const robots = await checkRobots(url);
    if (!robots.allowed) {
        throw new ScrapeError(
            `robots.txt does not allow WebScrapeXBot to fetch ${url.pathname}${robots.matchedRule ? ` (${robots.matchedRule})` : ''}.`,
            'robots',
            403,
        );
    }
    await log(robots.status === 'found' ? `robots.txt allows this path${robots.matchedRule ? ` (${robots.matchedRule})` : ''}` : 'No robots.txt rules apply', 'success');

    // 2. Politeness: at least 1 s (or the site's crawl-delay, max 10 s) between hits to one host.
    const gap = Math.min(10_000, Math.max(1000, (robots.crawlDelay ?? 0) * 1000));
    if (!(await politeSlot(url.host, gap))) {
        throw new ScrapeError(`Too many requests to ${url.host} right now. Try again in a few seconds.`, 'busy', 429);
    }

    // 3. Fetch
    let html = '';
    let finalUrl = url.toString();
    let status = 0;
    let contentType = '';
    let bytes = 0;
    let truncated = false;
    let engine = input.engine;
    let rendered: Awaited<ReturnType<typeof renderPage>> = null;

    if (engine === 'rendered') {
        try {
            rendered = await renderPage(url, {
                timeoutMs: Math.min(env.timeoutMs + 10_000, 40_000),
                capture: mode === 'full' || mode === 'design',
                log: (m) => log(m),
            });
        } catch (e) {
            warnings.push(`Browser engine failed (${(e as Error).message.split('\n')[0]}); used the static engine instead.`);
        }
        if (!rendered) {
            if (!warnings.length) warnings.push('No Chrome was found for the rendered engine; used the static engine instead. Set CHROME_EXECUTABLE_PATH or BROWSER_WS_ENDPOINT.');
            await log(warnings[warnings.length - 1], 'warning');
            engine = 'static';
        } else {
            html = rendered.html;
            finalUrl = rendered.finalUrl;
            status = rendered.status;
            contentType = rendered.contentType;
            bytes = Buffer.byteLength(html);
        }
    }

    if (engine === 'static') {
        await log(`GET ${url.toString()}`);
        const res = await safeFetchText(url);
        html = res.body;
        finalUrl = res.finalUrl;
        status = res.status;
        contentType = res.contentType;
        bytes = res.bytes;
        truncated = res.truncated;
        if (truncated) warnings.push('The page was larger than 3 MB; only the first 3 MB were parsed.');
    }

    if (status >= 400) {
        throw new ScrapeError(`${new URL(finalUrl).host} answered HTTP ${status}.`, 'http', 502);
    }
    if (contentType && !/html|xml|text\/plain/i.test(contentType)) {
        throw new ScrapeError(`Expected an HTML page but got ${contentType.split(';')[0]}.`, 'not_html', 415);
    }
    await log(`HTTP ${status} · ${(bytes / 1024).toFixed(1)} KB in ${Date.now() - started} ms`, 'success');

    // 4. Extract
    const $ = cheerio.load(html);
    const meta = extractMetadata(html, finalUrl);
    const result: ScrapeResult = {
        version: 2,
        url: finalUrl,
        options: { mode, engine, fields, rowSelector: input.rowSelector?.trim() || undefined },
        fetch: { requestedUrl: url.toString(), finalUrl, status, contentType, bytes, durationMs: 0, engine, truncated },
        robots,
        metadata: {
            ...meta,
            lang: $('html').attr('lang') || undefined,
            canonical: $('link[rel="canonical"]').attr('href') || undefined,
        },
        html: html.slice(0, 200_000),
        warnings,
        completedAt: '',
    };

    if (fields.length) {
        await log(`Running ${fields.length} field selector${fields.length === 1 ? '' : 's'}${result.options.rowSelector ? ` inside “${result.options.rowSelector}”` : ''}`);
        const out = runFieldSelectors($, fields, result.options.rowSelector, finalUrl);
        result.fields = { columns: out.columns, rows: out.rows };
        warnings.push(...out.errors);
        await log(`Selectors produced ${out.rows.length} row${out.rows.length === 1 ? '' : 's'}`, out.rows.length ? 'success' : 'warning');
    }

    const wants = {
        content: mode === 'full' || mode === 'content',
        social: mode === 'full' || mode === 'social',
        design: mode === 'full' || mode === 'design',
    };

    if (wants.content || wants.social) {
        const origin = new URL(finalUrl).origin;
        const seen = new Set<string>();
        result.links = [];
        $('a[href]').each((_, a) => {
            const raw = $(a).attr('href')!;
            if (/^(javascript:|mailto:|tel:|#)/i.test(raw)) return;
            let href: string;
            try {
                href = new URL(raw, finalUrl).toString();
            } catch {
                return;
            }
            if (seen.has(href) || seen.size >= 500) return;
            seen.add(href);
            const kind = SOCIAL_HOSTS.test(new URL(href).host) ? 'social' : href.startsWith(origin) ? 'internal' : 'external';
            result.links!.push({ href, text: $(a).text().replace(/\s+/g, ' ').trim().slice(0, 160), kind });
        });
        if (wants.content) {
            result.contentAnalysis = extractContent(html, finalUrl).analysis;
            result.headings = [];
            $('h1,h2,h3,h4,h5,h6').slice(0, 200).each((_, h) => {
                const text = $(h).text().replace(/\s+/g, ' ').trim();
                if (text) result.headings!.push({ level: Number(h.tagName.slice(1)), text });
            });
            result.tables = extractTables($);
            result.seo = auditSEO(html);
        }
    }

    if (wants.social) {
        result.social = extractSocialData(html);
        if (/linkedin\.com\/in\//.test(finalUrl)) {
            result.linkedinProfile = extractLinkedInProfile(html) ?? undefined;
        }
    }

    if (wants.design || wants.content) {
        const imgs = new Map<string, string>();
        $('img').each((_, img) => {
            const src = $(img).attr('src') || $(img).attr('data-src');
            if (!src || src.startsWith('data:')) return;
            try {
                const abs = new URL(src, finalUrl).toString();
                if (!imgs.has(abs)) imgs.set(abs, ($(img).attr('alt') ?? '').trim());
            } catch {
                /* skip */
            }
        });
        const og = $('meta[property="og:image"]').attr('content');
        if (og) {
            try {
                const abs = new URL(og, finalUrl).toString();
                if (!imgs.has(abs)) imgs.set(abs, 'Open Graph image');
            } catch {
                /* skip */
            }
        }
        rendered?.networkImages.forEach((u) => !imgs.has(u) && imgs.set(u, ''));
        result.images = [...imgs].slice(0, 300).map(([u, alt]) => ({ url: u, alt }));
    }

    if (wants.design) {
        const inlineCss = $('style').text() + ' ' + $('[style]').toArray().map((e) => $(e).attr('style')).join(';');
        const colorSource = [inlineCss, ...(rendered?.computedColors ?? [])].join(' ');
        result.colors = extractColors(colorSource).slice(0, 24);
        const fonts = new Set([...extractFonts(inlineCss, html), ...(rendered?.computedFonts ?? [])]);
        result.fonts = [...fonts].filter((f) => f.length > 1 && !/^(inherit|initial|-apple-system|system-ui)$/i.test(f)).slice(0, 20);
        result.technologies = detectTechnologies(html, inlineCss);
        if (rendered?.screenshot) result.screenshot = rendered.screenshot;
    } else if (mode === 'full' || mode === 'content') {
        result.technologies = detectTechnologies(html);
    }

    result.fetch.durationMs = Date.now() - started;
    result.completedAt = new Date().toISOString();
    await log(`Done in ${(result.fetch.durationMs / 1000).toFixed(1)} s`, 'success');
    return { result, pdf: rendered?.pdf };
}
