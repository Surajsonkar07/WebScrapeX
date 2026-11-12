import type { SEOAudit } from './extractors/seo';

/** What the scraper should collect. `custom` runs only the user's field selectors. */
export type ScrapeMode = 'full' | 'content' | 'social' | 'design' | 'custom';

/** `static` = plain HTTP fetch + Cheerio. `rendered` = headless Chrome (runs page JavaScript). */
export type ScrapeEngine = 'static' | 'rendered';

export type FieldAttribute = 'text' | 'html' | 'href' | 'src' | 'attr';

export interface FieldSelector {
    name: string;
    selector: string;
    attribute: FieldAttribute;
    /** Attribute name when `attribute === 'attr'` (e.g. `data-price`). */
    attrName?: string;
    /** Collect every match instead of the first one. Ignored when a row selector is set. */
    multiple?: boolean;
}

export interface ScrapeOptions {
    url: string;
    mode: ScrapeMode;
    engine: ScrapeEngine;
    fields: FieldSelector[];
    /** Optional repeating container (e.g. `article.product`). Each match becomes one row. */
    rowSelector?: string;
}

export interface LinkedInProfile {
    name: string;
    headline: string;
    location: string;
    about?: string;
    image?: string;
    connections?: string;
    experience: Array<{ title: string; company: string; duration?: string; location?: string }>;
    education: Array<{ school: string; degree?: string; duration?: string }>;
}

export interface SocialMetadata {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    ogType?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    twitterCreator?: string;
}

export interface ContentAnalysis {
    readabilityScore?: number;
    readingTime?: number;
    cleanText?: string;
    byline?: string;
    wordCount?: number;
}

export interface RobotsVerdict {
    allowed: boolean;
    robotsUrl: string;
    /** The rule that decided the verdict, e.g. `Disallow: /private`. */
    matchedRule?: string;
    crawlDelay?: number;
    /** How robots.txt itself responded. */
    status: 'found' | 'missing' | 'unreachable';
}

export interface FetchInfo {
    requestedUrl: string;
    finalUrl: string;
    status: number;
    contentType: string;
    bytes: number;
    durationMs: number;
    engine: ScrapeEngine;
    truncated: boolean;
}

export type DataRow = Record<string, string>;

export interface DataTable {
    caption: string;
    columns: string[];
    rows: DataRow[];
}

export interface ScrapeResult {
    version: 2;
    url: string;
    options: Omit<ScrapeOptions, 'url'>;
    fetch: FetchInfo;
    robots: RobotsVerdict;
    metadata: {
        title: string;
        description: string;
        keywords: string[];
        favicon: string;
        lang?: string;
        canonical?: string;
    };
    /** Custom selector output: one object per row. */
    fields?: { columns: string[]; rows: DataRow[] };
    tables?: DataTable[];
    headings?: Array<{ level: number; text: string }>;
    links?: Array<{ href: string; text: string; kind: 'internal' | 'external' | 'social' }>;
    images?: Array<{ url: string; alt: string }>;
    colors?: string[];
    fonts?: string[];
    technologies?: string[];
    social?: SocialMetadata;
    contentAnalysis?: ContentAnalysis;
    linkedinProfile?: LinkedInProfile;
    seo?: SEOAudit;
    screenshot?: string;
    pdfUrl?: string;
    /** First 200 KB of the page HTML. */
    html: string;
    warnings: string[];
    completedAt: string;
}
