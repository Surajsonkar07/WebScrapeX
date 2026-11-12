import type { FieldSelector } from '@/lib/scraper-types';

export interface Preset {
    id: string;
    label: string;
    hint: string;
    url?: string;
    rowSelector?: string;
    fields: FieldSelector[];
}

/** Starting points for the field editor. Each one runs as-is on a typical page. */
export const PRESETS: Preset[] = [
    {
        id: 'hn',
        label: 'Hacker News front page',
        hint: 'One row per story: title and link',
        url: 'https://news.ycombinator.com/',
        rowSelector: 'tr.athing',
        fields: [
            { name: 'rank', selector: '.rank', attribute: 'text' },
            { name: 'title', selector: '.titleline > a', attribute: 'text' },
            { name: 'link', selector: '.titleline > a', attribute: 'href' },
            { name: 'site', selector: '.sitestr', attribute: 'text' },
        ],
    },
    {
        id: 'article',
        label: 'Article',
        hint: 'Headline, author, date and lead paragraph',
        fields: [
            { name: 'headline', selector: 'h1', attribute: 'text' },
            { name: 'author', selector: '[rel="author"], [itemprop="author"], .author, .byline', attribute: 'text' },
            { name: 'published', selector: 'time[datetime]', attribute: 'attr', attrName: 'datetime' },
            { name: 'lead', selector: 'article p, main p', attribute: 'text' },
        ],
    },
    {
        id: 'products',
        label: 'Product cards',
        hint: 'Name, price, link and image for each card',
        rowSelector: '[itemtype*="Product"], .product, li.product, article.product_pod',
        fields: [
            { name: 'name', selector: '[itemprop="name"], h2, h3', attribute: 'text' },
            { name: 'price', selector: '[itemprop="price"], .price, .price_color', attribute: 'text' },
            { name: 'link', selector: 'a', attribute: 'href' },
            { name: 'image', selector: 'img', attribute: 'src' },
        ],
    },
    {
        id: 'links',
        label: 'Every link',
        hint: 'Anchor text and absolute URL',
        rowSelector: 'a[href]',
        fields: [
            { name: 'text', selector: '', attribute: 'text' },
            { name: 'url', selector: '', attribute: 'href' },
        ],
    },
    {
        id: 'headings',
        label: 'Heading outline',
        hint: 'h1–h3 in page order',
        rowSelector: 'h1, h2, h3',
        fields: [{ name: 'heading', selector: '', attribute: 'text' }],
    },
    {
        id: 'images',
        label: 'Images with alt text',
        hint: 'src and alt for each <img>',
        rowSelector: 'img',
        fields: [
            { name: 'src', selector: '', attribute: 'src' },
            { name: 'alt', selector: '', attribute: 'attr', attrName: 'alt' },
        ],
    },
];
