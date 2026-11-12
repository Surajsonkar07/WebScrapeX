'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export function HistoryFilters({ q, status, total }: { q: string; status: string; total: number }) {
    const router = useRouter();
    const [value, setValue] = useState(q);
    const [pending, start] = useTransition();

    useEffect(() => {
        if (value === q) return;
        const t = setTimeout(() => {
            const p = new URLSearchParams();
            if (value) p.set('q', value);
            if (status) p.set('status', status);
            start(() => router.replace(`/collections?${p}`));
        }, 300);
        return () => clearTimeout(t);
    }, [value, q, status, router]);

    const setStatus = (s: string) => {
        const p = new URLSearchParams();
        if (value) p.set('q', value);
        if (s) p.set('status', s);
        start(() => router.replace(`/collections?${p}`));
    };

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search by URL" className="pl-9" aria-label="Search history by URL" type="search" />
            </div>
            <div role="radiogroup" aria-label="Status" className="inline-flex w-fit rounded-md border border-border bg-muted p-0.5">
                {[
                    ['', 'All'],
                    ['completed', 'Done'],
                    ['failed', 'Failed'],
                ].map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={status === id}
                        onClick={() => setStatus(id)}
                        className={cn('h-8 rounded-[5px] px-3 text-sm text-muted-foreground', status === id && 'bg-card text-foreground shadow-[0_1px_2px_oklch(0_0_0/0.12)]')}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <span className="flex items-center gap-2 font-mono text-[12px] text-muted-foreground sm:ml-auto">
                {pending && <Loader2 className="size-3.5 animate-spin" />}
                {total} run{total === 1 ? '' : 's'}
            </span>
        </div>
    );
}
