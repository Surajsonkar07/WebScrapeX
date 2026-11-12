import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'primary' | 'accent' | 'danger' | 'warning';

const tones: Record<Tone, string> = {
    neutral: 'border-border bg-muted text-muted-foreground',
    primary: 'border-transparent bg-primary-soft text-primary-ink',
    accent: 'border-transparent bg-accent-soft text-accent-ink',
    danger: 'border-transparent bg-danger-soft text-danger',
    warning: 'border-transparent bg-warning-soft text-warning',
};

export function Badge({ tone = 'neutral', className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
    return (
        <span
            className={cn('inline-flex h-6 items-center gap-1.5 rounded-sm border px-2 font-mono text-[11px] font-medium tracking-wide whitespace-nowrap', tones[tone], className)}
            {...props}
        />
    );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div aria-hidden className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    return <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border-strong bg-card px-1 font-mono text-[10px] text-muted-foreground', className)} {...props} />;
}

/** Page heading block used at the top of every screen. */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-2">
                {eyebrow && <p className="label-mono">{eyebrow}</p>}
                <h1 className="text-3xl font-semibold sm:text-[2.5rem]">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}

export function EmptyState({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-14 text-center">
            {icon && <div className="grid size-11 place-items-center rounded-md border border-border bg-card text-muted-foreground [&_svg]:size-5">{icon}</div>}
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            {children && <div className="max-w-md text-sm text-muted-foreground">{children}</div>}
            {action}
        </div>
    );
}

export function StatusDot({ status }: { status: 'completed' | 'failed' | 'scraping' | 'pending' }) {
    const map = {
        completed: 'bg-accent',
        failed: 'bg-danger',
        scraping: 'bg-primary animate-pulse',
        pending: 'bg-border-strong',
    } as const;
    return <span aria-hidden className={cn('inline-block size-2 shrink-0 rounded-full', map[status])} />;
}
