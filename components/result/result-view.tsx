'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { toast } from 'sonner';
import {
    ArrowUpRight, CalendarPlus, Code2, Copy, Download, FileJson, FileSpreadsheet, FileText, ImageDown, Link2, ListTree, Palette, RotateCw, ScrollText, SearchCheck, Table2, Trash2, TriangleAlert, LayoutGrid,
} from 'lucide-react';
import type { ScrapeResult } from '@/lib/scraper-types';
import type { Job, JobLog } from '@/lib/store/types';
import { datasetsFor } from '@/lib/export';
import { formatBytes, formatDate, formatMs, hostOf } from '@/lib/format';
import { MODES } from '@/lib/scrape/schema';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/misc';
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/overlay';
import { DataTable } from './data-table';
import { ScheduleDialog } from './schedule-dialog';
import { CountUp } from './count-up';

interface Props {
    job: Job;
    result: ScrapeResult | null;
    logs: JobLog[];
}

export function ResultView({ job, result, logs }: Props) {
    const router = useRouter();
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [savingAssets, setSavingAssets] = useState(false);
    const datasets = useMemo(() => (result ? datasetsFor(result) : []), [result]);
    const tableSets = datasets.filter((d) => d.id === 'fields' || d.id.startsWith('table:'));
    const [activeSet, setActiveSet] = useState(tableSets[0]?.id ?? 'fields');
    // Selector runs open on their data; audits open on the overview.
    const firstTab = result?.fields?.rows.length ? 'data' : result ? 'overview' : 'log';

    const tabs = result
        ? [
              ...(result.fields?.rows.length
                  ? [{ id: 'data', label: 'Data', icon: Table2 }, { id: 'overview', label: 'Overview', icon: LayoutGrid }]
                  : [{ id: 'overview', label: 'Overview', icon: LayoutGrid }, tableSets.length && { id: 'data', label: 'Tables', icon: Table2 }]),
              result.seo && { id: 'seo', label: 'SEO', icon: SearchCheck },
              (result.headings?.length || result.contentAnalysis?.cleanText) && { id: 'content', label: 'Content', icon: ListTree },
              result.links?.length && { id: 'links', label: 'Links', icon: Link2 },
              (result.colors?.length || result.images?.length || result.fonts?.length || result.screenshot) && { id: 'design', label: 'Design', icon: Palette },
              { id: 'html', label: 'HTML', icon: Code2 },
              { id: 'log', label: 'Log', icon: ScrollText },
          ].filter(Boolean) as Array<{ id: string; label: string; icon: typeof Table2 }>
        : [{ id: 'log', label: 'Log', icon: ScrollText }];

    const remove = async () => {
        if (!confirm('Delete this job and its stored files? This cannot be undone.')) return;
        const res = await fetch(`/api/v2/jobs/${job.id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success('Job deleted');
            router.push('/collections');
            router.refresh();
        } else toast.error('Could not delete the job');
    };

    const saveAssets = async () => {
        setSavingAssets(true);
        try {
            const res = await fetch('/api/v2/scrape/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: job.id }) });
            const body = await res.json();
            if (!res.ok) toast.error(body.error ?? 'Could not save images');
            else toast.success(`Saved ${body.downloadedCount} of ${body.totalRequested} images`, { description: body.skipped?.length ? `${body.skipped.length} skipped (robots.txt, size or type).` : undefined });
            router.refresh();
        } finally {
            setSavingAssets(false);
        }
    };

    const copyJson = async () => {
        if (!result) return;
        const set = datasets.find((d) => d.id === activeSet) ?? datasets[0];
        await navigator.clipboard.writeText(JSON.stringify(set.rows, null, 2));
        toast.success(`Copied ${set.rows.length} rows as JSON`);
    };

    const exportBase = `/api/v2/jobs/${job.id}/export`;
    const modeLabel = MODES.find((x) => x.id === job.mode)?.label ?? job.mode;

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="space-y-5 border-b border-border pb-6">
                <nav aria-label="Breadcrumb" className="font-mono text-[12px] text-muted-foreground">
                    <Link href="/collections" className="hover:text-foreground">
                        history
                    </Link>{' '}
                    / <span>{job.id.slice(0, 8)}</span>
                </nav>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <Favicon src={result?.metadata.favicon} />
                        <div className="min-w-0 space-y-1.5">
                            <h1 className="text-2xl font-semibold break-words sm:text-3xl">{result?.metadata.title || hostOf(job.url)}</h1>
                            <a href={result?.url ?? job.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1 font-mono text-[13px] text-muted-foreground hover:text-primary-ink">
                                <span className="truncate">{result?.url ?? job.url}</span>
                                <ArrowUpRight className="size-3.5 shrink-0" />
                            </a>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        {result && (
                            <Menu>
                                <MenuTrigger asChild>
                                    <Button>
                                        <Download /> Export
                                    </Button>
                                </MenuTrigger>
                                <MenuContent className="w-64">
                                    <MenuLabel>JSON</MenuLabel>
                                    <MenuItem asChild>
                                        <a href={`${exportBase}?format=json`} download>
                                            <FileJson /> Result (no HTML)
                                        </a>
                                    </MenuItem>
                                    <MenuItem asChild>
                                        <a href={`${exportBase}?format=json&full=1`} download>
                                            <FileJson /> Full result with HTML
                                        </a>
                                    </MenuItem>
                                    <MenuSeparator />
                                    <MenuLabel>CSV</MenuLabel>
                                    {datasets.map((d) => (
                                        <MenuItem key={d.id} asChild>
                                            <a href={`${exportBase}?format=csv&dataset=${encodeURIComponent(d.id)}`} download>
                                                <FileSpreadsheet /> <span className="truncate">{d.label}</span>
                                                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{d.rows.length}</span>
                                            </a>
                                        </MenuItem>
                                    ))}
                                    {result.pdfUrl && (
                                        <>
                                            <MenuSeparator />
                                            <MenuItem asChild>
                                                <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                    <FileText /> PDF snapshot
                                                </a>
                                            </MenuItem>
                                        </>
                                    )}
                                </MenuContent>
                            </Menu>
                        )}
                        <Button variant="secondary" asChild>
                            <Link href={`/?url=${encodeURIComponent(job.url)}`}>
                                <RotateCw /> Run again
                            </Link>
                        </Button>
                        <Button variant="secondary" onClick={() => setScheduleOpen(true)}>
                            <CalendarPlus /> Schedule
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete job" onClick={remove}>
                            <Trash2 />
                        </Button>
                    </div>
                </div>

                {/* Readout strip */}
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 xl:grid-cols-6">
                    <Readout label="status">
                        <span className={cn('font-medium', job.status === 'failed' ? 'text-danger' : job.status === 'completed' ? 'text-accent-ink' : 'text-primary-ink')}>{job.status}</span>
                    </Readout>
                    <Readout label="http">{result ? result.fetch.status : '—'}</Readout>
                    <Readout label="size">{result ? formatBytes(result.fetch.bytes) : '—'}</Readout>
                    <Readout label="time">{result?.fetch.durationMs ? formatMs(result.fetch.durationMs) : '—'}</Readout>
                    <Readout label="mode">{modeLabel} · {result?.fetch.engine ?? job.engine}</Readout>
                    <Readout label="captured">
                        <span suppressHydrationWarning>{formatDate(job.completedAt ?? job.createdAt)}</span>
                    </Readout>
                </dl>
            </header>

            {job.status === 'failed' && (
                <div role="alert" className="flex gap-3 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm">
                    <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger" />
                    <div>
                        <p className="font-medium text-danger">This run failed</p>
                        <p>{job.error ?? 'See the log below for details.'}</p>
                    </div>
                </div>
            )}
            {result?.warnings.length ? (
                <ul className="space-y-1 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
                    {result.warnings.map((w) => (
                        <li key={w} className="flex gap-2">
                            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" /> {w}
                        </li>
                    ))}
                </ul>
            ) : null}

            <Tabs defaultValue={firstTab}>
                <TabsList aria-label="Result sections">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <TabsTrigger key={id} value={id}>
                            <Icon /> {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="pt-6">
                    {result && tableSets.length > 0 && (
                        <TabsContent value="data" className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {tableSets.map((d) => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => setActiveSet(d.id)}
                                        aria-pressed={activeSet === d.id}
                                        className={cn('min-h-9 rounded-md border border-border px-3 text-sm transition-colors hover:border-border-strong', activeSet === d.id && 'border-primary bg-primary-soft/60 font-medium')}
                                    >
                                        {d.label} <span className="ml-1 font-mono text-[11px] text-muted-foreground">{d.rows.length}</span>
                                    </button>
                                ))}
                                <div className="ml-auto flex gap-2">
                                    <Button variant="outline" size="sm" onClick={copyJson}>
                                        <Copy /> Copy JSON
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`${exportBase}?format=csv&dataset=${encodeURIComponent(activeSet)}`} download>
                                            <FileSpreadsheet /> CSV
                                        </a>
                                    </Button>
                                </div>
                            </div>
                            {(() => {
                                const d = tableSets.find((x) => x.id === activeSet) ?? tableSets[0];
                                return <DataTable key={d.id} columns={d.columns} rows={d.rows} caption={d.label} />;
                            })()}
                        </TabsContent>
                    )}

                    {result && (
                        <TabsContent value="overview">
                            <Overview result={result} />
                        </TabsContent>
                    )}

                    {result?.seo && (
                        <TabsContent value="seo">
                            <Seo seo={result.seo} />
                        </TabsContent>
                    )}

                    {result && (
                        <TabsContent value="content" className="grid gap-6 lg:grid-cols-[320px_1fr]">
                            <section aria-label="Heading outline" className="panel scroll-slim max-h-[640px] overflow-auto p-4">
                                <h3 className="label-mono mb-3">Outline</h3>
                                <ol className="space-y-1.5 text-sm">
                                    {(result.headings ?? []).map((h, i) => (
                                        <li key={i} style={{ paddingLeft: (h.level - 1) * 12 }} className="flex gap-2">
                                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">h{h.level}</span>
                                            <span className={h.level === 1 ? 'font-medium' : ''}>{h.text}</span>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                            <section aria-label="Readable text" className="panel p-5">
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {result.contentAnalysis?.wordCount !== undefined && <Badge>{result.contentAnalysis.wordCount.toLocaleString()} words</Badge>}
                                    {result.contentAnalysis?.readingTime !== undefined && <Badge>{result.contentAnalysis.readingTime} min read</Badge>}
                                    {result.contentAnalysis?.byline && <Badge tone="accent">{result.contentAnalysis.byline}</Badge>}
                                </div>
                                <div className="scroll-slim max-h-[560px] overflow-auto pr-2 text-[15px] leading-7 whitespace-pre-line text-foreground/90">
                                    {result.contentAnalysis?.cleanText?.slice(0, 20000) || <span className="text-muted-foreground">No main article text was detected on this page.</span>}
                                </div>
                            </section>
                        </TabsContent>
                    )}

                    {result?.links && (
                        <TabsContent value="links">
                            <LinksTab links={result.links} />
                        </TabsContent>
                    )}

                    {result && (
                        <TabsContent value="design">
                            <Design result={result} onSaveAssets={saveAssets} saving={savingAssets} jobId={job.id} />
                        </TabsContent>
                    )}

                    {result && (
                        <TabsContent value="html">
                            <HtmlTab html={result.html} />
                        </TabsContent>
                    )}

                    <TabsContent value="log">
                        <ol className="relative space-y-0 border-l border-border pl-5">
                            {logs.length === 0 && <li className="text-sm text-muted-foreground">No log lines were recorded.</li>}
                            {logs.map((l, i) => (
                                <li key={i} className="relative py-2">
                                    <span
                                        aria-hidden
                                        className={cn('absolute top-3.5 -left-[25px] size-2 rounded-full ring-4 ring-background', { info: 'bg-border-strong', success: 'bg-accent', warning: 'bg-warning', error: 'bg-danger' }[l.type])}
                                    />
                                    <p className={cn('text-sm', l.type === 'error' && 'text-danger')}>{l.message}</p>
                                    <time className="font-mono text-[11px] text-muted-foreground" suppressHydrationWarning>
                                        {new Date(l.createdAt).toLocaleTimeString()}
                                    </time>
                                </li>
                            ))}
                        </ol>
                    </TabsContent>
                </div>
            </Tabs>

            <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} url={job.url} options={result?.options ?? { mode: job.mode, engine: job.engine, fields: [] }} />
        </div>
    );
}

function Readout({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="bg-card px-4 py-3">
            <dt className="label-mono">{label}</dt>
            <dd className="mt-1 truncate font-mono text-[13px]">{children}</dd>
        </div>
    );
}

function Favicon({ src }: { src?: string }) {
    const [broken, setBroken] = useState(false);
    return (
        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-card">
            {src && !broken ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party favicon
                <img
                    src={src}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 object-contain"
                    referrerPolicy="no-referrer"
                    onError={() => setBroken(true)}
                    // The load may already have failed before hydration attached onError.
                    ref={(el) => {
                        if (el?.complete && el.naturalWidth === 0) setBroken(true);
                    }}
                />
            ) : (
                <Link2 className="size-5 text-muted-foreground" />
            )}
        </div>
    );
}

function Overview({ result }: { result: ScrapeResult }) {
    const s = result.social;
    const card = { title: s?.ogTitle || result.metadata.title, desc: s?.ogDescription || result.metadata.description, image: s?.ogImage };
    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <section className="panel space-y-4 p-5 lg:col-span-2">
                <h3 className="label-mono">Metadata</h3>
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)] [&_dd]:min-w-0 [&_dd]:break-words">
                    <dt className="text-muted-foreground">Title</dt>
                    <dd>{result.metadata.title || '—'}</dd>
                    <dt className="text-muted-foreground">Description</dt>
                    <dd>{result.metadata.description || '—'}</dd>
                    <dt className="text-muted-foreground">Keywords</dt>
                    <dd className="flex flex-wrap gap-1.5">{result.metadata.keywords.length ? result.metadata.keywords.slice(0, 20).map((k) => <Badge key={k} className="max-w-full truncate" title={k}>{k}</Badge>) : '—'}</dd>
                    <dt className="text-muted-foreground">Language</dt>
                    <dd className="font-mono text-[13px]">{result.metadata.lang ?? '—'}</dd>
                    <dt className="text-muted-foreground">Canonical</dt>
                    <dd className="font-mono text-[13px] break-all">{result.metadata.canonical ?? '—'}</dd>
                    <dt className="text-muted-foreground">robots.txt</dt>
                    <dd className="font-mono text-[13px]">{result.robots.matchedRule ?? (result.robots.status === 'missing' ? 'not present (all allowed)' : 'no matching rule (allowed)')}</dd>
                </dl>
            </section>

            <section className="panel space-y-4 p-5">
                <h3 className="label-mono">At a glance</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Stat label="SEO score" value={result.seo?.score} suffix="/100" />
                    <Stat label="Links" value={result.links?.length} />
                    <Stat label="Images" value={result.images?.length} />
                    <Stat label="Words" value={result.contentAnalysis?.wordCount} />
                </div>
                {result.technologies?.length ? (
                    <div className="space-y-2 border-t border-border pt-4">
                        <h4 className="label-mono">Built with</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {result.technologies.map((t) => (
                                <Badge key={t} tone="primary">
                                    {t}
                                </Badge>
                            ))}
                        </div>
                    </div>
                ) : null}
            </section>

            {(s || card.title) && (
                <section className="panel p-5 lg:col-span-2">
                    <h3 className="label-mono mb-4">Share preview</h3>
                    <div className="max-w-xl overflow-hidden rounded-lg border border-border">
                        {card.image && (
                            // eslint-disable-next-line @next/next/no-img-element -- remote Open Graph image
                            <img src={card.image} alt="" className="aspect-[1.91/1] w-full bg-muted object-cover" loading="lazy" referrerPolicy="no-referrer" />
                        )}
                        <div className="space-y-1 bg-muted/50 p-4">
                            <p className="font-mono text-[11px] text-muted-foreground uppercase">{hostOf(result.url)}</p>
                            <p className="font-medium">{card.title}</p>
                            <p className="line-clamp-2 text-sm text-muted-foreground">{card.desc}</p>
                        </div>
                    </div>
                    {s?.twitterCard && <p className="mt-3 font-mono text-[12px] text-muted-foreground">twitter:card = {s.twitterCard}</p>}
                </section>
            )}

            {result.linkedinProfile && (
                <section className="panel space-y-3 p-5">
                    <h3 className="label-mono">LinkedIn profile</h3>
                    <p className="font-medium">{result.linkedinProfile.name}</p>
                    <p className="text-sm text-muted-foreground">{result.linkedinProfile.headline}</p>
                    <p className="text-sm">{result.linkedinProfile.location}</p>
                    {result.linkedinProfile.experience.slice(0, 4).map((x, i) => (
                        <p key={i} className="text-sm">
                            {x.title} · <span className="text-muted-foreground">{x.company}</span>
                        </p>
                    ))}
                </section>
            )}
        </div>
    );
}

function Stat({ label, value, suffix }: { label: string; value?: number; suffix?: string }) {
    return (
        <div className="rounded-md border border-border bg-background/60 p-3">
            <p className="label-mono">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                {value === undefined ? '—' : <CountUp value={value} />}
                {value !== undefined && suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
            </p>
        </div>
    );
}

function Seo({ seo }: { seo: NonNullable<ScrapeResult['seo']> }) {
    const tone = seo.score >= 80 ? 'text-accent-ink' : seo.score >= 55 ? 'text-warning' : 'text-danger';
    return (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <section className="panel flex flex-col items-center justify-center gap-2 p-6 text-center">
                <svg viewBox="0 0 120 120" className="size-36" role="img" aria-label={`SEO score ${seo.score} of 100`}>
                    <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-muted" />
                    <m.circle
                        cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round" transform="rotate(-90 60 60)"
                        className={cn('stroke-current', tone)}
                        strokeDasharray={2 * Math.PI * 52}
                        initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - seo.score / 100) }}
                        transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
                    />
                    <text x="60" y="68" textAnchor="middle" className="fill-foreground font-display text-[30px] font-semibold">{seo.score}</text>
                </svg>
                <p className="label-mono">on-page SEO</p>
                <dl className="mt-2 grid w-full grid-cols-2 gap-2 text-left font-mono text-[12px]">
                    <dt className="text-muted-foreground">h1 tags</dt><dd className="text-right">{seo.metrics.h1Count}</dd>
                    <dt className="text-muted-foreground">h2 tags</dt><dd className="text-right">{seo.metrics.h2Count}</dd>
                    <dt className="text-muted-foreground">img w/o alt</dt><dd className="text-right">{seo.metrics.imagesWithoutAlt}/{seo.metrics.totalImages}</dd>
                    <dt className="text-muted-foreground">title len</dt><dd className="text-right">{seo.metrics.titleLength}</dd>
                </dl>
            </section>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {seo.findings.map((f) => (
                    <li key={f.title} className="flex gap-3 p-4">
                        <Badge tone={f.status === 'pass' ? 'accent' : f.status === 'warn' ? 'warning' : 'danger'} className="w-12 justify-center">
                            {f.status}
                        </Badge>
                        <div>
                            <p className="text-sm font-medium">{f.title}</p>
                            <p className="text-sm text-muted-foreground">{f.message}</p>
                        </div>
                        <span className="ml-auto hidden font-mono text-[11px] text-muted-foreground sm:block">{f.impact} impact</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function LinksTab({ links }: { links: NonNullable<ScrapeResult['links']> }) {
    const [kind, setKind] = useState<'all' | 'internal' | 'external' | 'social'>('all');
    const rows = links.filter((l) => kind === 'all' || l.kind === kind).map((l) => ({ ...l }));
    const count = (k: string) => links.filter((l) => l.kind === k).length;
    return (
        <div className="space-y-4">
            <div role="radiogroup" aria-label="Link type" className="flex flex-wrap gap-2">
                {(['all', 'internal', 'external', 'social'] as const).map((k) => (
                    <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn('min-h-9 rounded-md border border-border px-3 text-sm capitalize', kind === k && 'border-primary bg-primary-soft/60 font-medium')}>
                        {k} <span className="ml-1 font-mono text-[11px] text-muted-foreground">{k === 'all' ? links.length : count(k)}</span>
                    </button>
                ))}
            </div>
            <DataTable key={kind} columns={['text', 'href', 'kind']} rows={rows} caption="Links" linkColumns={['href']} />
        </div>
    );
}

function Design({ result, onSaveAssets, saving, jobId }: { result: ScrapeResult; onSaveAssets: () => void; saving: boolean; jobId: string }) {
    const copy = async (c: string) => {
        await navigator.clipboard.writeText(c);
        toast.success(`Copied ${c}`);
    };
    return (
        <div className="space-y-6">
            {result.screenshot && (
                <section className="panel overflow-hidden">
                    <h3 className="label-mono border-b border-border px-4 py-3">Screenshot · rendered engine</h3>
                    {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL captured by the scraper */}
                    <img src={result.screenshot} alt={`Screenshot of ${hostOf(result.url)}`} className="w-full" loading="lazy" />
                </section>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
                {result.colors?.length ? (
                    <section className="panel p-5">
                        <h3 className="label-mono mb-4">Colours · click to copy</h3>
                        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {result.colors.map((c) => (
                                <li key={c}>
                                    <button type="button" onClick={() => copy(c)} className="group w-full text-left" aria-label={`Copy ${c}`}>
                                        <span className="block aspect-square rounded-md border border-border transition-transform group-hover:-translate-y-0.5" style={{ background: c }} />
                                        <span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground">{c}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
                {result.fonts?.length ? (
                    <section className="panel p-5">
                        <h3 className="label-mono mb-4">Font families</h3>
                        <ul className="divide-y divide-border">
                            {result.fonts.map((f) => (
                                <li key={f} className="flex items-baseline justify-between gap-4 py-2">
                                    <span className="truncate text-lg" style={{ fontFamily: `"${f}", var(--font-sans)` }}>
                                        {f}
                                    </span>
                                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">Aa Bb 123</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </div>
            {result.images?.length ? (
                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="label-mono">Images · {result.images.length}</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <a href={`/api/v2/jobs/${jobId}/export?format=csv&dataset=images`} download>
                                    <FileSpreadsheet /> Image list
                                </a>
                            </Button>
                            <Button variant="secondary" size="sm" onClick={onSaveAssets} disabled={saving}>
                                <ImageDown /> {saving ? 'Saving…' : 'Save to storage'}
                            </Button>
                        </div>
                    </div>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {result.images.slice(0, 60).map((img) => (
                            <li key={img.url} className="overflow-hidden rounded-md border border-border bg-card">
                                <a href={img.url} target="_blank" rel="noopener noreferrer nofollow" className="block">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary scraped image */}
                                    <img src={img.url} alt={img.alt} loading="lazy" referrerPolicy="no-referrer" className="aspect-[4/3] w-full bg-muted object-cover" />
                                    <span className="block truncate px-2 py-1.5 font-mono text-[11px] text-muted-foreground">{img.alt || img.url.split('/').pop()}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </div>
    );
}

function HtmlTab({ html }: { html: string }) {
    const [wrap, setWrap] = useState(true);
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="font-mono text-[12px] text-muted-foreground">first {formatBytes(html.length)} of the response</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setWrap((w) => !w)}>
                        {wrap ? 'No wrap' : 'Wrap lines'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            await navigator.clipboard.writeText(html);
                            toast.success('HTML copied');
                        }}
                    >
                        <Copy /> Copy
                    </Button>
                </div>
            </div>
            <pre className={cn('scroll-slim max-h-[620px] overflow-auto rounded-lg border border-border bg-inset p-4 text-[12px] leading-5', wrap ? 'break-all whitespace-pre-wrap' : 'whitespace-pre')}>
                <code>{html.slice(0, 120_000)}</code>
            </pre>
        </div>
    );
}
