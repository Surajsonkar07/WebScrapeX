import 'server-only';
import { access } from 'node:fs/promises';
import { env } from '@/lib/env';
import { assertPublicHost } from './safe-fetch';

const LOCAL_CHROME = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
];

async function findLocalChrome(): Promise<string | undefined> {
    if (env.chromePath) return env.chromePath;
    for (const p of LOCAL_CHROME) {
        try {
            await access(p);
            return p;
        } catch {
            /* keep looking */
        }
    }
    return undefined;
}

export interface RenderedPage {
    html: string;
    finalUrl: string;
    status: number;
    contentType: string;
    computedColors: string[];
    computedFonts: string[];
    networkImages: string[];
    screenshot?: string;
    pdf?: Buffer;
}

/** Loads the page in headless Chrome. Returns null when no browser is available. */
export async function renderPage(
    url: URL,
    opts: { timeoutMs: number; capture: boolean; log: (m: string) => Promise<void> },
): Promise<RenderedPage | null> {
    const puppeteer = (await import('puppeteer-core')).default;
    let browser: import('puppeteer-core').Browser | null = null;

    try {
        if (env.browserWs) {
            await opts.log('Connecting to remote browser');
            browser = await puppeteer.connect({ browserWSEndpoint: env.browserWs });
        } else if (env.isServerless && env.chromiumPack) {
            await opts.log('Starting serverless Chromium');
            const chromium = (await import('@sparticuz/chromium-min')).default;
            browser = await puppeteer.launch({
                args: [...chromium.args, ...(env.proxyUrl ? [`--proxy-server=${env.proxyUrl}`] : [])],
                executablePath: await chromium.executablePath(env.chromiumPack),
                headless: true,
                defaultViewport: { width: 1366, height: 900 },
            });
        } else {
            const executablePath = await findLocalChrome();
            if (!executablePath) return null;
            await opts.log('Starting local Chrome');
            browser = await puppeteer.launch({
                executablePath,
                headless: true,
                args: ['--no-first-run', '--disable-dev-shm-usage', ...(env.proxyUrl ? [`--proxy-server=${env.proxyUrl}`] : [])],
                defaultViewport: { width: 1366, height: 900 },
            });
        }

        const page = await browser.newPage();
        await page.setUserAgent(env.userAgent);
        const networkImages = new Set<string>();

        // Re-check every top-level navigation (redirects included) against the SSRF guard.
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const target = req.url();
            if (req.isNavigationRequest() && req.frame() === page.mainFrame() && /^https?:/.test(target)) {
                assertPublicHost(new URL(target))
                    .then(() => req.continue())
                    .catch(() => req.abort('blockedbyclient'));
                return;
            }
            if (/^(data|blob):/.test(target)) return void req.continue();
            req.continue();
        });
        page.on('response', (res) => {
            if (res.request().resourceType() === 'image' && !res.url().startsWith('data:')) networkImages.add(res.url());
        });

        await opts.log(`Loading ${url.host} in the browser`);
        const response = await page
            .goto(url.toString(), { waitUntil: 'networkidle2', timeout: opts.timeoutMs })
            .catch(async (e: Error) => {
                await opts.log(`Page kept loading past the timeout (${e.message.split('\n')[0]}); using what rendered`);
                return null;
            });

        // Nudge lazy-loaded content into view.
        await page
            .evaluate(async () => {
                for (let y = 0; y < Math.min(document.body.scrollHeight, 12000); y += 800) {
                    window.scrollTo(0, y);
                    await new Promise((r) => setTimeout(r, 80));
                }
                window.scrollTo(0, 0);
            })
            .catch(() => undefined);

        const computed = await page
            .evaluate(() => {
                const colors = new Set<string>();
                const fonts = new Set<string>();
                const els = Array.from(document.querySelectorAll('body, body *')).slice(0, 1500);
                for (const el of els) {
                    const s = getComputedStyle(el);
                    if (s.color) colors.add(s.color);
                    if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(s.backgroundColor);
                    const f = s.fontFamily.split(',')[0]?.trim().replace(/['"]/g, '');
                    if (f) fonts.add(f);
                }
                return { colors: [...colors], fonts: [...fonts] };
            })
            .catch(() => ({ colors: [] as string[], fonts: [] as string[] }));

        let screenshot: string | undefined;
        let pdf: Buffer | undefined;
        if (opts.capture) {
            await opts.log('Capturing screenshot');
            const shot = await page.screenshot({ type: 'jpeg', quality: 62 }).catch(() => null);
            if (shot) screenshot = `data:image/jpeg;base64,${Buffer.from(shot).toString('base64')}`;
            const doc = await page.pdf({ format: 'A4', printBackground: true }).catch(() => null);
            if (doc) pdf = Buffer.from(doc);
        }

        return {
            html: await page.content(),
            finalUrl: page.url(),
            status: response?.status() ?? 200,
            contentType: response?.headers()['content-type'] ?? 'text/html',
            computedColors: computed.colors,
            computedFonts: computed.fonts,
            networkImages: [...networkImages],
            screenshot,
            pdf,
        };
    } finally {
        if (browser) {
            if (env.browserWs) await browser.disconnect().catch(() => undefined);
            else await browser.close().catch(() => undefined);
        }
    }
}
