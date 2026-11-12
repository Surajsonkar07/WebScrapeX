'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { m, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ArrowRight, Copy, Download, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label, Textarea } from '@/components/ui/field';
import { DataTable } from '@/components/result/data-table';
import { toCsv } from '@/lib/export';
import type { DataRow } from '@/lib/scraper-types';

const schema = z.object({
    url: z.string().trim().min(4, 'Enter a URL'),
    prompt: z.string().trim().min(4, 'Describe what to extract').max(1000),
});

const EXAMPLES = [
    'Every job posting: title, location, team and apply link',
    'The pricing plans with monthly price and the features listed under each',
    'All upcoming events with date, venue and ticket URL',
];

/** Flattens an AI response into rows when it is (or contains) an array of objects. */
function toRows(data: unknown): { columns: string[]; rows: DataRow[] } | null {
    const arr = Array.isArray(data) ? data : data && typeof data === 'object' ? Object.values(data).find(Array.isArray) : null;
    if (!arr || !arr.length || typeof arr[0] !== 'object') return null;
    const columns = [...new Set(arr.flatMap((o) => (o && typeof o === 'object' ? Object.keys(o) : [])))].slice(0, 20);
    const rows = arr.map((o) => Object.fromEntries(columns.map((c) => [c, o?.[c] == null ? '' : typeof o[c] === 'object' ? JSON.stringify(o[c]) : String(o[c])])));
    return { columns, rows };
}

export function AiExtract({ configured }: { configured: boolean }) {
    const [result, setResult] = useState<{ data: unknown; url: string; durationMs: number } | null>(null);
    const { register, handleSubmit, setValue, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { url: '', prompt: '' } });

    const submit = handleSubmit(async (v) => {
        setResult(null);
        const res = await fetch('/api/v2/scrape/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            toast.error('Extraction failed', { description: body.error });
            return;
        }
        setResult({ data: body.data, url: body.url, durationMs: body.durationMs });
    });

    if (!configured) {
        return (
            <div className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-ink">
                    <KeyRound className="size-5" />
                </div>
                <div className="space-y-2 text-sm">
                    <p className="font-display text-lg font-semibold">Add a Gemini API key to turn this on</p>
                    <p className="text-muted-foreground">
                        Put <span className="font-mono text-[13px] text-foreground">GOOGLE_AI_API_KEY</span> in <span className="font-mono text-[13px] text-foreground">.env.local</span> (or your host&apos;s environment settings) and restart the server. Optional:{' '}
                        <span className="font-mono text-[13px] text-foreground">GEMINI_MODEL</span> to pick another model.
                    </p>
                    <p className="text-muted-foreground">Selector-based scraping on the Console keeps working without it.</p>
                </div>
            </div>
        );
    }

    const table = result ? toRows(result.data) : null;
    const json = result ? JSON.stringify(result.data, null, 2) : '';

    return (
        <div className="space-y-6">
            <form onSubmit={submit} className="panel space-y-4 p-5" noValidate>
                <div className="space-y-1.5">
                    <Label htmlFor="ai-url">Page URL</Label>
                    <Input id="ai-url" {...register('url')} inputMode="url" placeholder="https://example.com/careers" className="font-mono text-[14px]" aria-invalid={!!formState.errors.url} />
                    <FieldError>{formState.errors.url?.message}</FieldError>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ai-prompt">What should come back?</Label>
                    <Textarea id="ai-prompt" {...register('prompt')} rows={3} placeholder="List every product with its name, price and stock status" aria-invalid={!!formState.errors.prompt} />
                    <FieldError>{formState.errors.prompt?.message}</FieldError>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {EXAMPLES.map((e) => (
                            <button key={e} type="button" onClick={() => setValue('prompt', e)} className="min-h-9 rounded-md border border-dashed border-border-strong px-2.5 text-left text-[13px] text-muted-foreground hover:border-primary hover:text-foreground">
                                {e}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-[13px] text-muted-foreground">5 requests per minute. Only the visible page text is sent to the model.</p>
                    <Button type="submit" disabled={formState.isSubmitting}>
                        {formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                        {formState.isSubmitting ? 'Extracting…' : 'Extract'}
                        {!formState.isSubmitting && <ArrowRight />}
                    </Button>
                </div>
            </form>

            <AnimatePresence>
                {result && (
                    <m.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4" aria-label="Extraction result">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-mono text-[12px] text-muted-foreground">
                                {result.url} · {(result.durationMs / 1000).toFixed(1)} s
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(json); toast.success('JSON copied'); }}>
                                    <Copy /> Copy JSON
                                </Button>
                                {table && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const blob = new Blob([toCsv(table)], { type: 'text/csv;charset=utf-8' });
                                            const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'ai-extract.csv' });
                                            a.click();
                                            URL.revokeObjectURL(a.href);
                                        }}
                                    >
                                        <Download /> CSV
                                    </Button>
                                )}
                            </div>
                        </div>
                        {table ? <DataTable columns={table.columns} rows={table.rows} caption="AI extraction" /> : null}
                        <pre className="scroll-slim max-h-[480px] overflow-auto rounded-lg border border-border bg-inset p-4 text-[12px] leading-5">
                            <code>{json}</code>
                        </pre>
                    </m.section>
                )}
            </AnimatePresence>
        </div>
    );
}
