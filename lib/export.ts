import type { DataRow, ScrapeResult } from '@/lib/scraper-types';

/** Datasets a result can be exported as. `table:N` is the Nth HTML table. */
export interface Dataset {
    id: string;
    label: string;
    columns: string[];
    rows: DataRow[];
}

export function datasetsFor(r: ScrapeResult): Dataset[] {
    const out: Dataset[] = [];
    if (r.fields?.rows.length) out.push({ id: 'fields', label: 'Selector fields', columns: r.fields.columns, rows: r.fields.rows });
    r.tables?.forEach((t, i) => out.push({ id: `table:${i}`, label: t.caption, columns: t.columns, rows: t.rows }));
    if (r.links?.length) out.push({ id: 'links', label: 'Links', columns: ['href', 'text', 'kind'], rows: r.links.map((l) => ({ ...l })) });
    if (r.images?.length) out.push({ id: 'images', label: 'Images', columns: ['url', 'alt'], rows: r.images.map((i) => ({ ...i })) });
    if (r.headings?.length) out.push({ id: 'headings', label: 'Headings', columns: ['level', 'text'], rows: r.headings.map((h) => ({ level: `h${h.level}`, text: h.text })) });
    const meta: DataRow[] = [
        { key: 'url', value: r.url },
        { key: 'title', value: r.metadata.title },
        { key: 'description', value: r.metadata.description },
        { key: 'keywords', value: r.metadata.keywords.join(', ') },
        { key: 'favicon', value: r.metadata.favicon },
        { key: 'lang', value: r.metadata.lang ?? '' },
        { key: 'canonical', value: r.metadata.canonical ?? '' },
        { key: 'http_status', value: String(r.fetch.status) },
        { key: 'engine', value: r.fetch.engine },
        { key: 'technologies', value: (r.technologies ?? []).join(', ') },
        { key: 'colors', value: (r.colors ?? []).join(' ') },
        { key: 'fonts', value: (r.fonts ?? []).join(', ') },
        ...Object.entries(r.social ?? {}).filter(([, v]) => v).map(([k, v]) => ({ key: k, value: String(v) })),
    ];
    out.push({ id: 'meta', label: 'Page metadata', columns: ['key', 'value'], rows: meta });
    return out;
}

function cell(v: string | undefined): string {
    let s = v ?? '';
    // Neutralise spreadsheet formula injection.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(d: Pick<Dataset, 'columns' | 'rows'>): string {
    const lines = [d.columns.map(cell).join(',')];
    for (const row of d.rows) lines.push(d.columns.map((c) => cell(row[c])).join(','));
    // BOM so Excel opens UTF-8 correctly.
    return '﻿' + lines.join('\r\n') + '\r\n';
}

export function exportFileName(r: Pick<ScrapeResult, 'url'>, suffix: string, ext: string) {
    let host = 'scrape';
    try {
        host = new URL(r.url).host.replace(/^www\./, '');
    } catch {
        /* keep default */
    }
    return `${host}-${suffix}`.replace(/[^a-z0-9.-]+/gi, '-').toLowerCase() + `.${ext}`;
}

/** JSON export without the bulky inline screenshot and HTML unless asked for. */
export function toJson(r: ScrapeResult, full = false): string {
    if (full) return JSON.stringify(r, null, 2);
    const rest: Partial<ScrapeResult> = { ...r };
    delete rest.html;
    delete rest.screenshot;
    return JSON.stringify(rest, null, 2);
}
