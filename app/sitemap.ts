import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
    return ['/login', '/signup', '/docs'].map((p) => ({ url: `${base}${p}`, changeFrequency: 'monthly', priority: p === '/docs' ? 0.8 : 0.6 }));
}
