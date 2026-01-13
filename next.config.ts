import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-core'],
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core'],
    // @ts-ignore
    outputFileTracingExcludes: {
      '*': [
        './tmp/**/*',
        './node_modules/@puppeteer/browsers/**/*',
        './node_modules/puppeteer-core/.local-chromium/**/*',
        './node_modules/canvas/**/*',
      ],
    },
  },
};

export default nextConfig;
