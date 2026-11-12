import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'WebScrapeX',
        short_name: 'WebScrapeX',
        description: 'Scrape any page into clean rows. CSS selectors, audits, CSV/JSON export and job history.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f8f6f1',
        theme_color: '#16181d',
        categories: ['developer', 'productivity', 'utilities'],
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
            { name: 'New scrape', url: '/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'History', url: '/collections', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
    };
}
