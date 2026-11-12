import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import { supabaseEnabled } from '@/lib/env';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', axes: ['opsz'] });
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: { default: 'WebScrapeX — scrape any page into clean data', template: '%s · WebScrapeX' },
    description:
        'Point WebScrapeX at a URL, pick CSS selectors or an audit mode, and get rows you can export as CSV or JSON. Respects robots.txt, rate-limited, with job history and an HTTP API.',
    applicationName: 'WebScrapeX',
    keywords: ['web scraper', 'CSS selectors', 'CSV export', 'robots.txt', 'SEO audit', 'Next.js'],
    openGraph: {
        type: 'website',
        siteName: 'WebScrapeX',
        title: 'WebScrapeX — scrape any page into clean data',
        description: 'CSS-selector scraping, page audits and CSV/JSON export. Polite by default: robots.txt and rate limits built in.',
    },
    twitter: { card: 'summary_large_image' },
    appleWebApp: { capable: true, title: 'WebScrapeX', statusBarStyle: 'default' },
    formatDetection: { telephone: false },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f8f6f1' },
        { media: '(prefers-color-scheme: dark)', color: '#16181d' },
    ],
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable}`}>
            <body className="min-h-dvh">
                <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow-panel">
                    Skip to content
                </a>
                <Providers mode={supabaseEnabled ? 'supabase' : 'local'}>{children}</Providers>
            </body>
        </html>
    );
}
