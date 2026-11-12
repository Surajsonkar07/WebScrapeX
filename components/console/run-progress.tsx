'use client';

import { useEffect, useState } from 'react';
import { m } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = (engine: string, mode: string) => [
    { label: 'robots.txt', at: 0 },
    { label: engine === 'rendered' ? 'browser render' : 'HTTP fetch', at: 700 },
    { label: 'parse HTML', at: engine === 'rendered' ? 6000 : 2200 },
    { label: mode === 'custom' ? 'run selectors' : 'extract', at: engine === 'rendered' ? 8000 : 3000 },
    { label: 'save to history', at: engine === 'rendered' ? 10000 : 4200 },
];

/**
 * The scrape runs as one server request, so this is an honest-but-estimated
 * stage readout: it advances on typical timings and never claims "done".
 */
export function RunProgress({ engine, mode }: { engine: string; mode: string }) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const start = performance.now();
        const id = setInterval(() => setElapsed(performance.now() - start), 100);
        return () => clearInterval(id);
    }, []);
    const steps = STEPS(engine, mode);
    const current = steps.reduce((acc, s, i) => (elapsed >= s.at ? i : acc), 0);

    return (
        <m.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border bg-inset">
            <div className="relative h-0.5 overflow-hidden bg-border">
                <div className="absolute inset-y-0 w-1/3 animate-scan bg-primary" />
            </div>
            <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 font-mono text-[12px]" aria-live="polite">
                {steps.map((s, i) => (
                    <li key={s.label} className={cn('flex items-center gap-1.5', i > current ? 'text-muted-foreground/60' : i === current ? 'text-foreground' : 'text-muted-foreground')}>
                        {i < current ? <Check className="size-3.5 text-accent" /> : i === current ? <span className="size-1.5 animate-pulse rounded-full bg-primary" /> : <span className="size-1.5 rounded-full bg-border-strong" />}
                        {s.label}
                    </li>
                ))}
                <li className="ml-auto text-muted-foreground tabular-nums">{(elapsed / 1000).toFixed(1)}s</li>
            </ol>
        </m.div>
    );
}
