'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { DataRow } from '@/lib/scraper-types';
import { Input } from '@/components/ui/field';

const PAGE = 100;

/** Scrollable preview table. Wide tables scroll inside the frame, never the page. */
export function DataTable({ columns, rows, caption, linkColumns = [] }: { columns: string[]; rows: DataRow[]; caption: string; linkColumns?: string[] }) {
    const [q, setQ] = useState('');
    const [limit, setLimit] = useState(PAGE);
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return s ? rows.filter((r) => columns.some((c) => r[c]?.toLowerCase().includes(s))) : rows;
    }, [rows, columns, q]);

    const isLink = (c: string, v: string) => (linkColumns.includes(c) || /^(url|href|link|src|image)$/i.test(c)) && /^https?:\/\//.test(v);

    return (
        <div className="space-y-3">
            {rows.length > 8 && (
                <div className="relative max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder={`Filter ${rows.length} rows`} className="pl-9" aria-label="Filter rows" />
                </div>
            )}
            <div className="scroll-slim max-h-[560px] overflow-auto rounded-lg border border-border bg-card">
                <table className="w-full min-w-max border-collapse text-left text-[13px]">
                    <caption className="sr-only">{caption}</caption>
                    <thead className="sticky top-0 z-10 bg-muted">
                        <tr>
                            <th scope="col" className="w-12 border-b border-border px-3 py-2 text-right font-mono text-[11px] font-normal text-muted-foreground">#</th>
                            {columns.map((c) => (
                                <th key={c} scope="col" className="border-b border-border px-3 py-2 font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                    {c}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.slice(0, limit).map((r, i) => (
                            <tr key={i} className="align-top odd:bg-background/40 hover:bg-primary-soft/40">
                                <td className="border-b border-border px-3 py-2 text-right font-mono text-[11px] text-muted-foreground tabular-nums">{i + 1}</td>
                                {columns.map((c) => {
                                    const v = r[c] ?? '';
                                    return (
                                        <td key={c} className="max-w-[420px] border-b border-border px-3 py-2">
                                            {v === '' ? (
                                                <span className="text-muted-foreground/50">—</span>
                                            ) : isLink(c, v) ? (
                                                <a href={v} target="_blank" rel="noopener noreferrer nofollow" className="line-clamp-2 font-mono text-[12px] break-all text-primary-ink underline-offset-2 hover:underline">
                                                    {v}
                                                </a>
                                            ) : (
                                                <span className="line-clamp-3 break-words">{v}</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No rows match “{q}”.</p>}
            </div>
            <div className="flex items-center justify-between font-mono text-[12px] text-muted-foreground">
                <span>
                    Showing {Math.min(limit, filtered.length)} of {filtered.length}
                    {filtered.length !== rows.length && ` (filtered from ${rows.length})`}
                </span>
                {filtered.length > limit && (
                    <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="min-h-9 rounded-md px-2 font-sans text-sm font-medium text-primary-ink hover:bg-muted">
                        Show {Math.min(PAGE, filtered.length - limit)} more
                    </button>
                )}
            </div>
        </div>
    );
}
