import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: '*', allow: ['/login', '/signup', '/docs'], disallow: ['/api/', '/result/', '/admin', '/auth/'] }],
        sitemap: `${base}/sitemap.xml`,
    };
}
