'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Polls the server component while a job started elsewhere is still running. */
export function AutoRefresh({ label, every = 2500 }: { label: string; every?: number }) {
    const router = useRouter();
    useEffect(() => {
        const id = setInterval(() => router.refresh(), every);
        return () => clearInterval(id);
    }, [router, every]);
    return (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-md border border-border bg-primary-soft/50 px-3 py-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> {label}
        </p>
    );
}
