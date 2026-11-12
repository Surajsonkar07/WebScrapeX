import type { CheerioAPI, Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { DataRow, DataTable, FieldSelector } from '@/lib/scraper-types';

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function absolutize(value: string, base: string) {
    if (!value) return value;
    try {
        return new URL(value, base).toString();
    } catch {
        return value;
    }
}

function readValue($: CheerioAPI, el: Cheerio<AnyNode>, field: FieldSelector, baseUrl: string): string {
    switch (field.attribute) {
        case 'html':
            return ($.html(el) ?? '').trim();
        case 'href':
            return absolutize(el.attr('href') ?? '', baseUrl);
        case 'src':
            return absolutize(el.attr('src') ?? el.attr('data-src') ?? '', baseUrl);
        case 'attr':
            return clean(el.attr(field.attrName || '') ?? '');
        default:
            return clean(el.text());
    }
}

/**
 * Runs the user's selectors. With a row selector, every container match is a
 * row and fields are resolved inside it. Without one, fields resolve against
 * the whole page; `multiple` fields spread into extra rows (zipped by index).
 */
export function runFieldSelectors(
    $: CheerioAPI,
    fields: FieldSelector[],
    rowSelector: string | undefined,
    baseUrl: string,
    maxRows = 1000,
): { columns: string[]; rows: DataRow[]; errors: string[] } {
    const errors: string[] = [];
    const columns = fields.map((f) => f.name);
    const rows: DataRow[] = [];

    const safeSelect = (sel: string, scope?: Cheerio<AnyNode>): Cheerio<AnyNode> | null => {
        try {
            return scope ? scope.find(sel) : $(sel);
        } catch {
            errors.push(`Invalid CSS selector: ${sel}`);
            return null;
        }
    };

    if (rowSelector?.trim()) {
        const containers = safeSelect(rowSelector.trim());
        containers?.slice(0, maxRows).each((_, node) => {
            const scope = $(node);
            const row: DataRow = {};
            for (const f of fields) {
                const match = f.selector.trim() ? safeSelect(f.selector, scope) : scope;
                row[f.name] = match && match.length ? readValue($, match.first(), f, baseUrl) : '';
            }
            rows.push(row);
        });
        return { columns, rows, errors: [...new Set(errors)] };
    }

    const values = fields.map((f) => {
        const matches = safeSelect(f.selector);
        if (!matches || !matches.length) return [''];
        const list = f.multiple ? matches.slice(0, maxRows).toArray() : [matches.first().get(0)!];
        return list.map((n) => readValue($, $(n), f, baseUrl));
    });
    const height = Math.max(1, ...values.map((v) => v.length));
    for (let i = 0; i < height; i++) {
        const row: DataRow = {};
        fields.forEach((f, j) => {
            row[f.name] = values[j][i] ?? (fields[j].multiple ? '' : values[j][0]);
        });
        rows.push(row);
    }
    return { columns, rows, errors: [...new Set(errors)] };
}

/** Turns the first few HTML tables into header/row objects. */
export function extractTables($: CheerioAPI, limit = 6): DataTable[] {
    const tables: DataTable[] = [];
    $('table').slice(0, limit).each((i, t) => {
        const table = $(t);
        let headers = table.find('thead tr').first().find('th,td').toArray().map((c) => clean($(c).text()));
        let bodyRows = table.find('tbody tr').toArray();
        if (!bodyRows.length) bodyRows = table.find('tr').toArray();
        if (!headers.length) {
            const first = $(bodyRows[0]);
            if (first.find('th').length) {
                headers = first.find('th,td').toArray().map((c) => clean($(c).text()));
                bodyRows = bodyRows.slice(1);
            }
        }
        const width = Math.max(headers.length, ...bodyRows.map((r) => $(r).find('th,td').length), 0);
        // Skip layout tables (one row or one column): they are page structure, not data.
        if (width < 2 || bodyRows.length < 2) return;
        const columns = Array.from({ length: width }, (_, k) => headers[k] || `Column ${k + 1}`);
        const unique = columns.map((c, k) => (columns.indexOf(c) === k ? c : `${c} (${k + 1})`));
        const rows = bodyRows.slice(0, 500).map((r) => {
            const cells = $(r).find('th,td').toArray().map((c) => clean($(c).text()));
            return Object.fromEntries(unique.map((c, k) => [c, cells[k] ?? '']));
        });
        const caption = clean(table.find('caption').first().text()) || clean(table.attr('aria-label') ?? '') || `Table ${i + 1}`;
        tables.push({ caption, columns: unique, rows });
    });
    return tables;
}
