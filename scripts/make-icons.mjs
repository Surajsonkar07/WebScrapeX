// Renders the WebScrapeX capture-frame mark to the PWA icon sizes. Run: node scripts/make-icons.mjs
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const ORANGE = '#EA7A33';
const INK = '#24170F';

const mark = (size, { inset = 0, rx = 7 } = {}) => {
    const s = 32 / (1 - inset * 2);
    const o = (s - 32) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-o} ${-o} ${s} ${s}">
  <rect x="${-o}" y="${-o}" width="${s}" height="${s}" rx="${inset ? 0 : rx}" fill="${ORANGE}"/>
  <g fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="square"><path d="M8 13V8h5M19 8h5v5M24 19v5h-5M13 24H8v-5"/></g>
  <rect x="13.5" y="13.5" width="5" height="5" rx="1" fill="${INK}"/>
</svg>`;
};

const png = (svg, out) => sharp(Buffer.from(svg)).png().toFile(out);

await png(mark(192), 'public/icons/icon-192.png');
await png(mark(512), 'public/icons/icon-512.png');
await png(mark(512, { inset: 0.14 }), 'public/icons/maskable-512.png');
await png(mark(180, { inset: 0.08 }), 'app/apple-icon.png');
await writeFile('app/icon.svg', mark(32));
console.log('icons written');
