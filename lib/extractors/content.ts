import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ContentAnalysis } from '../scraper-types';

export interface ContentData {
    headings: {
        h1: string[];
        h2: string[];
        h3: string[];
        h4: string[];
        h5: string[];
        h6: string[];
    };
    text_content: {
        paragraphs: string[];
        summary: string; // First 500 chars
    };
    links: {
        internal: string[];
        external: string[];
        social: string[];
        total_count: number;
    };
    images: {
        url: string;
        alt: string;
    }[];
    analysis?: ContentAnalysis;
}

export function extractContent(html: string, baseUrl: string): ContentData {
    const $ = cheerio.load(html);
    const content: ContentData = {
        headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
        text_content: { paragraphs: [], summary: '' },
        links: { internal: [], external: [], social: [], total_count: 0 },
        images: [],
        analysis: {}
    };

    // --- Readability Analysis ---
    try {
        const doc = new JSDOM(html, { url: baseUrl });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();

        if (article) {
            // Estimated reading time: 200 words per minute
            const textContent = article.textContent || '';
            const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
            const readingTime = Math.ceil(wordCount / 200);

            content.analysis = {
                readabilityScore: 0, // Placeholder for future expansion
                readingTime,
                cleanText: textContent.trim(),
                byline: article.byline || undefined,
                wordCount
            };
        }
    } catch (e) {
        console.warn('Readability parsing failed:', e);
    }

    // --- Cheerio Extraction (Legacy + Statistical) ---

    // Extract Headings
    $('h1').each((_, el) => { content.headings.h1.push($(el).text().trim()); });
    $('h2').each((_, el) => { content.headings.h2.push($(el).text().trim()); });
    $('h3').each((_, el) => { content.headings.h3.push($(el).text().trim()); });
    $('h4').each((_, el) => { content.headings.h4.push($(el).text().trim()); });
    $('h5').each((_, el) => { content.headings.h5.push($(el).text().trim()); });
    $('h6').each((_, el) => { content.headings.h6.push($(el).text().trim()); });

    // Clean empty headings
    (Object.keys(content.headings) as Array<keyof ContentData['headings']>).forEach(k => {
        content.headings[k] = content.headings[k].filter(t => t.length > 0);
    });

    // Extract Paragraphs (limit to reasonable length to avoid garbage)
    $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
            content.text_content.paragraphs.push(text);
        }
    });
    // Fallback summary if Readability fails
    if (!content.analysis?.cleanText) {
        content.text_content.summary = content.text_content.paragraphs.join(' ').substring(0, 500) + '...';
    } else {
        content.text_content.summary = content.analysis.cleanText.substring(0, 500) + '...';
    }

    // Extract Links
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        const isJunk = !href || href.startsWith('javascript:') || href === '#' || href === '';
        if (!isJunk) {
            const isSocial = /facebook|twitter|linkedin|instagram|youtube|github|tiktok/i.test(href);

            if (isSocial) {
                if (!content.links.social.includes(href)) content.links.social.push(href);
            } else if (href.startsWith('/') || href.includes(baseUrl) || !href.startsWith('http')) {
                if (!content.links.internal.includes(href)) content.links.internal.push(href);
            } else {
                if (!content.links.external.includes(href)) content.links.external.push(href);
            }
        }
    });
    content.links.total_count = content.links.internal.length + content.links.external.length + content.links.social.length;

    // Extract Images
    $('img').each((_, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt') || '';
        if (src && !src.startsWith('data:')) {
            // Normalize URL if needed, but for now just take src
            content.images.push({ url: src, alt });
        }
    });

    return content;
}
