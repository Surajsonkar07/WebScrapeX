import withSerwistInit from '@serwist/next';

const revision = Date.now().toString(36);

const withSerwist = withSerwistInit({
    swSrc: 'app/sw.ts',
    swDest: 'public/sw.js',
    cacheOnNavigation: true,
    reloadOnOnline: false,
    disable: process.env.NODE_ENV === 'development',
    additionalPrecacheEntries: [{ url: '/offline', revision }],
});

const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    reactStrictMode: true,
    serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min', 'jsdom'],
    outputFileTracingExcludes: { '*': ['./.data/**', './tmp/**', './report-assets/**'] },
    images: { formats: ['image/avif', 'image/webp'] },
    experimental: { optimizePackageImports: ['lucide-react', 'radix-ui'] },
    async headers() {
        return [{ source: '/:path*', headers: securityHeaders }];
    },
    async redirects() {
        return [{ source: '/history', destination: '/collections', permanent: false }];
    },
};

export default withSerwist(nextConfig);
