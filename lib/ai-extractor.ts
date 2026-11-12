import 'server-only';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/lib/env';

/** Strips markup to readable text plus link/image hints so the prompt stays small. */
function condense(html: string): string {
    const $ = cheerio.load(html);
    $('script,style,noscript,svg,iframe,template').remove();
    $('a[href]').each((_, a) => {
        $(a).append(` [${$(a).attr('href')}]`);
    });
    $('img[src]').each((_, img) => {
        $(img).replaceWith(` [image: ${$(img).attr('alt') ?? ''} ${$(img).attr('src')}] `);
    });
    return $('body').text().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 60_000);
}

export async function extractWithAI(html: string, prompt: string, pageUrl: string): Promise<unknown> {
    if (!env.googleAiKey) throw new Error('AI extraction is not set up: add GOOGLE_AI_API_KEY to the server environment.');
    const model = new GoogleGenerativeAI(env.googleAiKey).getGenerativeModel({
        model: env.geminiModel,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    const text = condense(html);
    const request = [
        'You extract structured data from a web page.',
        'Return only JSON. Prefer an array of objects with consistent keys when the request asks for a list.',
        'Use null for values that are not present on the page. Never invent data.',
        `Page URL: ${pageUrl}`,
        `Request: ${prompt}`,
        '--- PAGE TEXT ---',
        text,
    ].join('\n');

    const res = await model.generateContent(request);
    const raw = res.response.text().replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    try {
        return JSON.parse(raw);
    } catch {
        throw new Error('The AI model returned something that is not valid JSON. Try a more specific request.');
    }
}
