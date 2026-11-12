'use client';

import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { CircleCheck, CircleSlash, Clock, Loader2, ShieldQuestion } from 'lucide-react';
import type { RobotsVerdict } from '@/lib/scraper-types';
import { cn } from '@/lib/utils';

interface Preflight {
    url: string;
    host: string;
    robots: RobotsVerdict;
    quota: { minute: { used: number; limit: number }; hour: { used: number; limit: number } };
}

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ok'; data: Preflight } | { kind: 'error'; message: string };

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
    const pct = Math.min(100, (used / Math.max(1, limit)) * 100);
    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between font-mono text-[12px]">
                <span className="text-muted-foreground">{label}</span>
                <span>
                    {limit - used}
                    <span className="text-muted-foreground">/{limit} left</span>
                </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <m.div className={cn('h-full rounded-full', pct > 80 ? 'bg-danger' : 'bg-accent')} initial={false} animate={{ width: `${100 - pct}%` }} />
            </div>
        </div>
    );
}

/** Live robots.txt + quota readout for the URL being typed. */
export function PreflightPanel({ url, refreshKey }: { url: string; refreshKey: number }) {
    const [fetched, setState] = useState<State>({ kind: 'idle' });
    const valid = /^(https?:\/\/)?[^\s/]+\.[^\s]{2,}/.test(url.trim());
    // An unusable URL always shows the idle hint, whatever the last check said.
    const state: State = valid ? fetched : { kind: 'idle' };

    useEffect(() => {
        const value = url.trim();
        if (!/^(https?:\/\/)?[^\s/]+\.[^\s]{2,}/.test(value)) return;
        const ctrl = new AbortController();
        const t = setTimeout(async () => {
            setState({ kind: 'loading' });
            try {
                const res = await fetch(`/api/v2/preflight?url=${encodeURIComponent(value)}`, { signal: ctrl.signal });
                const body = await res.json();
                setState(res.ok ? { kind: 'ok', data: body } : { kind: 'error', message: body.error ?? 'Check failed' });
            } catch (e) {
                if ((e as Error).name !== 'AbortError') setState({ kind: 'error', message: 'Could not run the check.' });
            }
        }, 550);
        return () => {
            clearTimeout(t);
            ctrl.abort();
        };
    }, [url, refreshKey]);

    return (
        <section aria-labelledby="preflight-h" className="panel p-4">
            <div className="mb-4 flex items-center justify-between">
                <h2 id="preflight-h" className="label-mono">
                    Pre-flight
                </h2>
                {state.kind === 'loading' && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Checking" />}
            </div>

            <AnimatePresence mode="wait" initial={false}>
                <m.div key={state.kind} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4" aria-live="polite">
                    {state.kind === 'idle' && (
                        <p className="text-sm text-muted-foreground">
                            Type a URL and we&apos;ll check its <span className="font-mono text-[13px]">robots.txt</span> before you run anything.
                        </p>
                    )}
                    {state.kind === 'loading' && <p className="text-sm text-muted-foreground">Reading robots.txt…</p>}
                    {state.kind === 'error' && (
                        <div className="flex gap-2.5 text-sm text-danger">
                            <CircleSlash className="mt-0.5 size-4 shrink-0" />
                            {state.message}
                        </div>
                    )}
                    {state.kind === 'ok' && (
                        <>
                            <div className="flex gap-3">
                                {state.data.robots.allowed ? (
                                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-accent" />
                                ) : state.data.robots.status === 'unreachable' ? (
                                    <ShieldQuestion className="mt-0.5 size-5 shrink-0 text-warning" />
                                ) : (
                                    <CircleSlash className="mt-0.5 size-5 shrink-0 text-danger" />
                                )}
                                <div className="min-w-0 space-y-1">
                                    <p className="text-sm font-medium">
                                        {state.data.robots.allowed ? 'Allowed by robots.txt' : 'Blocked by robots.txt'}
                                    </p>
                                    <p className="truncate font-mono text-[12px] text-muted-foreground" title={state.data.url}>
                                        {state.data.host}
                                    </p>
                                    <p className="font-mono text-[12px] text-muted-foreground">
                                        {state.data.robots.matchedRule ?? (state.data.robots.status === 'missing' ? 'no robots.txt — all paths allowed' : 'no rule matches this path')}
                                    </p>
                                </div>
                            </div>
                            {state.data.robots.crawlDelay !== undefined && (
                                <p className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
                                    <Clock className="size-3.5" /> crawl-delay {state.data.robots.crawlDelay}s honoured
                                </p>
                            )}
                            <div className="space-y-3 border-t border-border pt-4">
                                <Meter label="this minute" used={state.data.quota.minute.used} limit={state.data.quota.minute.limit} />
                                <Meter label="this hour" used={state.data.quota.hour.used} limit={state.data.quota.hour.limit} />
                            </div>
                        </>
                    )}
                </m.div>
            </AnimatePresence>
        </section>
    );
}
