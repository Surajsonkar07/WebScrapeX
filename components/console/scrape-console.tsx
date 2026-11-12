'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { m, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ArrowRight, ChevronDown, CircleAlert, Layers, Plus, RotateCcw, Trash2, Wand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label, Select } from '@/components/ui/field';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from '@/components/ui/overlay';
import { MODES, scrapeRequestSchema } from '@/lib/scrape/schema';
import { readDefaults } from '@/lib/use-defaults';
import { cn } from '@/lib/utils';
import { PreflightPanel } from './preflight';
import { PRESETS } from './presets';
import { RunProgress } from './run-progress';

type FormIn = z.input<typeof scrapeRequestSchema>;
type FormOut = z.output<typeof scrapeRequestSchema>;


export function ScrapeConsole({ initialUrl, signedIn }: { initialUrl?: string; signedIn: boolean }) {
    const router = useRouter();
    const [running, setRunning] = useState(false);
    const [failure, setFailure] = useState<{ message: string; jobId?: string } | null>(null);
    const [preflightKey, setPreflightKey] = useState(0);
    const [showFields, setShowFields] = useState(false);
    const urlRef = useRef<HTMLInputElement | null>(null);

    const form = useForm<FormIn, unknown, FormOut>({
        resolver: zodResolver(scrapeRequestSchema),
        defaultValues: { url: initialUrl ?? '', mode: 'full', engine: 'static', fields: [], rowSelector: '' },
    });
    const { register, control, handleSubmit, setValue, reset, formState } = form;
    const fields = useFieldArray({ control, name: 'fields' });
    const [url, mode, engine] = useWatch({ control, name: ['url', 'mode', 'engine'] });

    // Restore saved defaults (Settings → Scrape defaults).
    useEffect(() => {
        const saved = readDefaults();
        if (MODES.some((x) => x.id === saved.mode)) setValue('mode', saved.mode as FormIn['mode']);
        if (saved.engine === 'static' || saved.engine === 'rendered') setValue('engine', saved.engine);
    }, [setValue]);

    // "Fields only" mode is meaningless without the editor, so it stays open there.
    const fieldsOpen = showFields || mode === 'custom';

    const applyPreset = (id: string) => {
        const p = PRESETS.find((x) => x.id === id);
        if (!p) return;
        setShowFields(true);
        fields.replace(p.fields.map((f) => ({ ...f })));
        setValue('rowSelector', p.rowSelector ?? '');
        if (p.url && !url) setValue('url', p.url);
        if (p.url && url !== p.url) toast(`Preset “${p.label}” is written for ${new URL(p.url).host}`, { description: 'Selectors may need tweaks for other sites.' });
    };

    const onSubmit = async (values: FormOut) => {
        if (!signedIn) {
            router.push(`/login?next=${encodeURIComponent(`/?url=${values.url}`)}`);
            return;
        }
        setFailure(null);
        setRunning(true);
        try {
            const res = await fetch('/api/v2/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, fields: values.fields.filter((f) => f.name.trim()) }),
            });
            const body = await res.json().catch(() => ({}));
            setPreflightKey((k) => k + 1);
            if (res.status === 429) {
                setFailure({ message: body.error ?? 'Rate limit reached.' });
                toast.error('Rate limit reached', { description: body.error });
                return;
            }
            if (!res.ok && !body.id) {
                setFailure({ message: body.error ?? `Request failed (${res.status})` });
                return;
            }
            if (body.status === 'failed') {
                setFailure({ message: body.error, jobId: body.id });
                router.refresh();
                return;
            }
            toast.success('Scrape finished', { description: body.summary?.title || values.url });
            router.push(`/result/${body.id}`);
        } catch {
            setFailure({ message: 'Network error — is the server running?' });
        } finally {
            setRunning(false);
        }
    };

    const { ref: urlRegisterRef, ...urlField } = register('url');

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-5" noValidate aria-busy={running}>
                {/* Command line */}
                <div className="panel overflow-hidden">
                    <label htmlFor="url" className="sr-only">
                        URL to scrape
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-stretch">
                        <div className="flex min-w-0 flex-1 items-center">
                            <span className="ml-3 hidden rounded-sm bg-primary-soft px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary-ink sm:inline">GET</span>
                            <input
                                id="url"
                                {...urlField}
                                ref={(el) => {
                                    urlRegisterRef(el);
                                    urlRef.current = el;
                                }}
                                type="text"
                                inputMode="url"
                                autoComplete="url"
                                spellCheck={false}
                                autoFocus
                                placeholder="https://example.com/page"
                                aria-invalid={!!formState.errors.url}
                                className="h-14 w-full min-w-0 bg-transparent px-3 font-mono text-[15px] outline-none placeholder:text-muted-foreground/60"
                            />
                        </div>
                        <Button type="submit" size="lg" disabled={running} className="m-2 h-11 sm:m-1.5 sm:h-auto sm:px-6">
                            {running ? 'Running…' : signedIn ? 'Run scrape' : 'Sign in to run'}
                            <ArrowRight />
                        </Button>
                    </div>
                    <AnimatePresence>{running && <RunProgress mode={mode ?? 'full'} engine={engine ?? 'static'} />}</AnimatePresence>
                </div>
                <FieldError>{formState.errors.url?.message}</FieldError>

                {/* Mode */}
                <fieldset className="space-y-3">
                    <legend className="label-mono mb-3">What to collect</legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {MODES.map((opt) => (
                            <label
                                key={opt.id}
                                className={cn(
                                    'relative flex min-h-11 cursor-pointer flex-col justify-center rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:border-border-strong has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                                    mode === opt.id && 'border-primary bg-primary-soft/60',
                                )}
                            >
                                <input type="radio" value={opt.id} {...register('mode')} className="sr-only" />
                                <span className="text-sm font-medium">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{MODES.find((x) => x.id === mode)?.hint}</p>
                </fieldset>

                {/* Engine */}
                <fieldset className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <legend className="text-sm font-medium">Engine</legend>
                        <p className="text-[13px] text-muted-foreground">
                            {engine === 'rendered' ? 'Headless Chrome runs the page’s JavaScript, then captures a screenshot. Slower.' : 'Plain HTTP fetch and HTML parse. Fast; misses content drawn by JavaScript.'}
                        </p>
                    </div>
                    <div role="radiogroup" aria-label="Engine" className="inline-flex shrink-0 rounded-md border border-border bg-muted p-0.5">
                        {(['static', 'rendered'] as const).map((e) => (
                            <label key={e} className={cn('cursor-pointer rounded-[5px] px-3 py-1.5 text-sm text-muted-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring', engine === e && 'bg-card text-foreground shadow-[0_1px_2px_oklch(0_0_0/0.12)]')}>
                                <input type="radio" value={e} {...register('engine')} className="sr-only" />
                                {e === 'static' ? 'Static' : 'Rendered'}
                            </label>
                        ))}
                    </div>
                </fieldset>

                {/* Fields */}
                <section className="rounded-lg border border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <button type="button" onClick={() => setShowFields((s) => !s)} aria-expanded={fieldsOpen} className="flex min-h-10 items-center gap-2 text-sm font-medium">
                            <ChevronDown className={cn('size-4 transition-transform', !fieldsOpen && '-rotate-90')} />
                            Fields <span className="font-normal text-muted-foreground">— CSS selectors → columns</span>
                            {fields.fields.length > 0 && <span className="rounded-sm bg-muted px-1.5 font-mono text-[11px]">{fields.fields.length}</span>}
                        </button>
                        <Menu>
                            <MenuTrigger asChild>
                                <Button type="button" variant="outline" size="sm">
                                    <Wand /> Presets
                                </Button>
                            </MenuTrigger>
                            <MenuContent className="w-72">
                                <MenuLabel>Start from</MenuLabel>
                                {PRESETS.map((p) => (
                                    <MenuItem key={p.id} onSelect={() => applyPreset(p.id)} className="flex-col items-start gap-0 py-2">
                                        <span>{p.label}</span>
                                        <span className="text-xs text-muted-foreground">{p.hint}</span>
                                    </MenuItem>
                                ))}
                            </MenuContent>
                        </Menu>
                    </div>

                    <AnimatePresence initial={false}>
                        {fieldsOpen && (
                            <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="space-y-4 border-t border-border p-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="rowSelector" className="flex items-center gap-2">
                                            <Layers className="size-4 text-muted-foreground" /> Row selector <span className="font-normal text-muted-foreground">(optional)</span>
                                        </Label>
                                        <Input id="rowSelector" {...register('rowSelector')} placeholder="e.g. article.product — one row per match" className="font-mono text-[13px]" spellCheck={false} />
                                        <p className="text-[13px] text-muted-foreground">With a row selector, each field is looked up inside every match. Leave a field&apos;s selector empty to read the row element itself.</p>
                                    </div>

                                    <ul className="space-y-3">
                                        <AnimatePresence initial={false}>
                                            {fields.fields.map((f, i) => (
                                                <m.li key={f.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -8 }} className="grid grid-cols-2 gap-2 rounded-md border border-border bg-card p-3 sm:grid-cols-[1fr_1.6fr_auto_auto] sm:items-end sm:border-0 sm:bg-transparent sm:p-0">
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`f-${i}-name`} className="text-xs text-muted-foreground">Column</Label>
                                                        <Input id={`f-${i}-name`} {...register(`fields.${i}.name`)} placeholder="price" className="font-mono text-[13px]" aria-invalid={!!formState.errors.fields?.[i]?.name} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor={`f-${i}-sel`} className="text-xs text-muted-foreground">CSS selector</Label>
                                                        <Input id={`f-${i}-sel`} {...register(`fields.${i}.selector`)} placeholder=".price" className="font-mono text-[13px]" spellCheck={false} />
                                                    </div>
                                                    <AttrPicker index={i} register={register} control={control} />
                                                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove field ${i + 1}`} onClick={() => fields.remove(i)} className="justify-self-end">
                                                        <Trash2 />
                                                    </Button>
                                                </m.li>
                                            ))}
                                        </AnimatePresence>
                                    </ul>

                                    <div className="flex flex-wrap gap-2">
                                        <Button type="button" variant="secondary" size="sm" onClick={() => fields.append({ name: `field_${fields.fields.length + 1}`, selector: '', attribute: 'text' })} disabled={fields.fields.length >= 25}>
                                            <Plus /> Add field
                                        </Button>
                                        {fields.fields.length > 0 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => reset({ ...form.getValues(), fields: [], rowSelector: '' })}>
                                                <RotateCcw /> Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </m.div>
                        )}
                    </AnimatePresence>
                </section>

                <AnimatePresence>
                    {failure && (
                        <m.div role="alert" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3 rounded-lg border border-danger/30 bg-danger-soft p-4">
                            <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" />
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-danger">The scrape did not complete</p>
                                <p className="text-foreground/85">{failure.message}</p>
                                {failure.jobId && (
                                    <Link href={`/result/${failure.jobId}`} className="inline-block pt-1 font-medium text-primary-ink underline-offset-4 hover:underline">
                                        Open the job log
                                    </Link>
                                )}
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>
            </form>

            <div className="grid gap-4 md:grid-cols-2 xl:sticky xl:top-10 xl:block xl:space-y-4 xl:self-start">
                <PreflightPanel url={url ?? ''} refreshKey={preflightKey} />
                <aside className="rounded-lg border border-dashed border-border-strong p-4 text-[13px] text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">Polite by default</p>
                    Requests identify as <span className="font-mono">WebScrapeXBot</span>, obey robots.txt and crawl-delay, and keep at least one second between hits to the same site.
                </aside>
            </div>
        </div>
    );
}

function AttrPicker({ index, register, control }: { index: number; register: ReturnType<typeof useForm<FormIn, unknown, FormOut>>['register']; control: ReturnType<typeof useForm<FormIn, unknown, FormOut>>['control'] }) {
    const attribute = useWatch({ control, name: `fields.${index}.attribute` });
    return (
        <div className="col-span-2 flex gap-2 sm:col-span-1">
            <div className="flex-1 space-y-1 sm:w-28">
                <Label htmlFor={`f-${index}-attr`} className="text-xs text-muted-foreground">Read</Label>
                <Select id={`f-${index}-attr`} {...register(`fields.${index}.attribute`)} className="font-mono text-[13px]">
                    <option value="text">text</option>
                    <option value="href">href</option>
                    <option value="src">src</option>
                    <option value="html">html</option>
                    <option value="attr">attr…</option>
                </Select>
            </div>
            {attribute === 'attr' && (
                <div className="flex-1 space-y-1 sm:w-28">
                    <Label htmlFor={`f-${index}-an`} className="text-xs text-muted-foreground">Attribute</Label>
                    <Input id={`f-${index}-an`} {...register(`fields.${index}.attrName`)} placeholder="data-id" className="font-mono text-[13px]" />
                </div>
            )}
        </div>
    );
}
