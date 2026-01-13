import puppeteer from 'puppeteer-core';

// ... imports ...

// Inside scrapeWebsite function:
await log('Launching deep-analysis browser (Hybrid Mode)...');

let browser;
if (process.env.BROWSER_WS_ENDPOINT) {
    await log(`Connecting to remote browser...`);
    browser = await puppeteer.connect({
        browserWSEndpoint: process.env.BROWSER_WS_ENDPOINT,
    });
} else {
    await log('No remote browser configured (PUPPETEER_CORE active). Skipping deep (JS) analysis.', 'warning');
    // Throw to fall back to static scraping
    throw new Error('No BROWSER_WS_ENDPOINT configured for production scraping.');
}

// Removing the old launch block entirely for now to save space in this replacement
/* 
const browser = await puppeteer.launch({ ...old args... }) 
*/
import { supabase } from './supabase';
import { extractMetadata } from './extractors/meta';
import { extractColors } from './extractors/colors';
import { extractFonts } from './extractors/fonts';
import { detectTechnologies } from './extractors/tech';
import { extractContent } from './extractors/content';
import { ScrapeResult } from './scraper-types';

// We need to disable strict type checking for website-scraper as it doesn't have perfect types
const runScrape = scrape as any;
const supabaseClient = supabase as any;

export async function scrapeWebsite(id: string, url: string): Promise<ScrapeResult> {
    const log = async (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
        console.log(`[${id}] ${message}`);
        await supabaseClient.from('logs').insert({ website_id: id, message, type });
    };

    try {
        let deepFindings = { colors: [] as string[], fonts: [] as string[], images: [] as string[] };
        let liveHtml = '';

        try {
            await log('Launching deep-analysis browser (Hybrid Mode)...');

            const browser = await puppeteer.launch({
                headless: true,
                protocolTimeout: 60000,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--ignore-certificate-errors',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process'
                ]
            });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

            await log(`Navigating to ${url}...`);
            try {
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
            } catch (e) {
                await log('Navigation timeout reached, proceeding with partial load...', 'warning');
            }

            // Scroll to trigger lazy loading
            await log('Scrolling to trigger lazy loading...');
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    let distance = 200;
                    let timer = setInterval(() => {
                        let scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight || totalHeight > 5000) { // Cap at 5000px
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });

            await log('Performing deep DOM extraction (Colors, Fonts, Images)...');
            deepFindings = await page.evaluate(() => {
                const colors = new Set<string>();
                const fonts = new Set<string>();
                const images = new Set<string>();

                // Sample elements for colors and fonts
                const allElements = document.querySelectorAll('*');
                const sampleSize = Math.min(allElements.length, 1000);
                for (let i = 0; i < sampleSize; i++) {
                    const el = allElements[i];
                    const style = window.getComputedStyle(el);

                    // Colors
                    if (style.color && style.color.startsWith('rgb')) colors.add(style.color);
                    if (style.backgroundColor && style.backgroundColor.startsWith('rgb') && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        colors.add(style.backgroundColor);
                    }

                    // Fonts
                    if (style.fontFamily) {
                        const firstFont = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
                        if (firstFont && firstFont !== 'inherit') fonts.add(firstFont);
                    }

                    // Background Images
                    if (style.backgroundImage && style.backgroundImage !== 'none') {
                        const match = style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
                        if (match) images.add(match[1]);
                    }
                }

                // Regular Images
                document.querySelectorAll('img').forEach(img => {
                    if (img.src) images.add(img.src);
                });

                return {
                    colors: Array.from(colors),
                    fonts: Array.from(fonts),
                    images: Array.from(images)
                };
            });

            liveHtml = await page.content();
            await browser.close();
            await log(`Live analysis complete. Found ${deepFindings.colors.length} colors, ${deepFindings.fonts.length} fonts, and ${deepFindings.images.length} images.`);
        } catch (e: any) {
            await log(`Deep analysis partially failed: ${e.message}. Falling back to static pass...`, 'warning');
        }

        const scrapeDir = path.resolve(process.cwd(), 'tmp', 'scrapes', id);
        // website-scraper will create the directory, we just ensure the parent exists
        await fs.mkdir(path.dirname(scrapeDir), { recursive: true });

        await log('Archiving assets to disk (Second Pass)...');
        const options = {
            urls: [url],
            directory: scrapeDir,
            urlFilter: () => true,
            plugins: [
                new PuppeteerPlugin({
                    launchOptions: {
                        headless: "new",
                        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--disable-web-security'],
                    },
                    scrollToBottom: { timeout: 10000, viewportN: 5 },
                    waitUntil: 'networkidle2',
                    timeout: 60000, // Increase navigation timeout for the archive pass
                })
            ],
        };

        let result = [];
        try {
            result = await runScrape(options);
            await log(`Archived ${result.length} resources.`);
        } catch (e: any) {
            await log(`Archiving pass failed or timed out: ${e.message}. Processing deep findings only...`, 'warning');
        }

        let htmlContent = liveHtml;
        if (!htmlContent && result.length > 0 && result[0].filename) {
            try {
                htmlContent = await fs.readFile(path.join(scrapeDir, result[0].filename), 'utf-8');
            } catch (e) {
                await log('Failed to read archived index file.', 'warning');
            }
        }

        if (!htmlContent) {
            await log('No HTML content could be retrieved. Using minimal fallback.', 'warning');
            htmlContent = `<html><head><title>${url}</title></head><body><p>Scrape failed to retrieve content for ${url}</p></body></html>`;
        }

        // Process Everything
        await log('Synthesizing results...');
        const metadata = extractMetadata(htmlContent, url);
        const technologies = detectTechnologies(htmlContent, deepFindings.colors.join(' '));

        const mergedImages: any[] = deepFindings.images.filter(u => u && !u.startsWith('data:')).map(url => ({ url, size: 0 }));
        const cssFiles: any[] = [];
        const jsFiles: any[] = [];
        const rawAssets: any[] = [];
        const linksSet = new Set<string>();

        // Merge archived assets
        for (const res of result) {
            const filename = res.filename;
            const absPath = path.join(scrapeDir, filename);
            const ext = path.extname(filename).split('?')[0].toLowerCase();

            let stats;
            try { stats = await fs.stat(absPath); } catch { continue; }

            rawAssets.push({
                website_id: id,
                file_type: ext.substring(1) || 'other',
                local_path: absPath,
                url: res.url,
                size_bytes: stats.size,
            });

            if (ext === '.css' || filename.includes('.css')) {
                cssFiles.push({ name: filename, size: stats.size });
            } else if (ext.includes('.js')) {
                jsFiles.push({ name: filename, size: stats.size });
            }
        }

        // Extract Links from rendered HTML
        const contentData = extractContent(htmlContent, url);
        contentData.links.internal.forEach((l: string) => linksSet.add(l));
        contentData.links.external.forEach((l: string) => linksSet.add(l));

        // Refine colors and fonts
        const processedColors = extractColors(deepFindings.colors.join(' '));
        const processedFonts = extractFonts('', htmlContent); // Checks for @import/google fonts
        deepFindings.fonts.forEach(f => processedFonts.push(f));

        // Process Images & Upload to Supabase Storage
        await log('Uploading top images to persistent storage...');
        const persistentImages: string[] = [];
        const topImages = mergedImages.map(img => {
            if (img.url.startsWith('/')) {
                img.url = new URL(img.url, url).href;
            }
            return img;
        }).slice(0, 50);

        for (const img of topImages) {
            try {
                const response = await fetch(img.url, { signal: AbortSignal.timeout(10000) });
                if (!response.ok) continue;

                const buffer = await response.arrayBuffer();
                const contentType = response.headers.get('content-type') || 'image/png';
                const filename = `img_${Math.random().toString(36).substring(7)}_${path.basename(img.url).split('?')[0]}`;
                const storagePath = `${id}/${filename}`;

                const { error: uploadError } = await supabaseClient.storage
                    .from('scrapes')
                    .upload(storagePath, buffer, { contentType, upsert: true });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('scrapes')
                        .getPublicUrl(storagePath);
                    persistentImages.push(publicUrl);
                }
            } catch (e) {
                // Skip failed downloads
            }
        }

        const finalResult: ScrapeResult = {
            url,
            metadata: {
                title: metadata.title || 'No Title',
                description: metadata.description || 'No description found.',
                keywords: metadata.keywords || [],
                favicon: metadata.favicon || '/favicon.ico'
            },
            colors: processedColors.slice(0, 25),
            fonts: Array.from(new Set(processedFonts)).filter(f => f.length > 2).slice(0, 30),
            images: persistentImages.length > 0 ? persistentImages.map(url => ({ url })) : topImages,
            cssFiles,
            jsFiles,
            html: htmlContent,
            links: Array.from(linksSet).filter(l => l.length > 1).slice(0, 100),
            technologies,
            rawAssets
        };

        // Save Findings to Supabase
        await log('Saving analysis results to database...');
        await supabaseClient.from('metadata').insert({
            website_id: id,
            title: finalResult.metadata.title,
            description: finalResult.metadata.description,
            keywords: finalResult.metadata.keywords,
            favicon: finalResult.metadata.favicon,
            color_palette: finalResult.colors,
            fonts: finalResult.fonts,
            technologies: finalResult.technologies,
            images: persistentImages, // Save permanent URLs
        });

        if (rawAssets.length > 0) {
            await supabaseClient.from('assets').insert(rawAssets);
        }

        // Save JSON for UI retrieval - ensure directory exists
        await fs.mkdir(scrapeDir, { recursive: true });
        await fs.writeFile(path.join(scrapeDir, 'result.json'), JSON.stringify(finalResult, null, 2));

        // Update main status
        await supabaseClient.from('websites').update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            total_assets: rawAssets.length,
        }).eq('id', id);

        await log('Scrape completed successfully!', 'success');
        return finalResult;

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await log(`Scrape failed: ${errorMessage}`, 'error');
        await supabaseClient.from('websites').update({ status: 'failed' }).eq('id', id);
        throw error;
    }
}
