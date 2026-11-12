import { z } from 'zod';

export const fieldSchema = z.object({
    name: z.string().trim().min(1, 'Field name is required').max(60),
    selector: z.string().trim().max(300),
    attribute: z.enum(['text', 'html', 'href', 'src', 'attr']).default('text'),
    attrName: z.string().trim().max(60).optional(),
    multiple: z.boolean().optional(),
});

export const scrapeRequestSchema = z.object({
    url: z.string().trim().min(3, 'Enter a URL').max(2048),
    mode: z.enum(['full', 'content', 'social', 'design', 'custom']).default('full'),
    engine: z.enum(['static', 'rendered']).default('static'),
    fields: z.array(fieldSchema).max(25).default([]),
    rowSelector: z.string().trim().max(300).optional(),
    /** v1 compatibility: `fastMode: false` meant "use the browser". */
    fastMode: z.boolean().optional(),
});

export type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;

export const MODES = [
    { id: 'full', label: 'Full audit', hint: 'Metadata, content, links, tables, SEO, social and design' },
    { id: 'content', label: 'Content', hint: 'Readable text, headings, tables and links' },
    { id: 'social', label: 'Social', hint: 'Open Graph, Twitter cards and outbound profiles' },
    { id: 'design', label: 'Design', hint: 'Colours, fonts, images and tech stack' },
    { id: 'custom', label: 'Fields only', hint: 'Just your CSS selectors — fastest' },
] as const;
