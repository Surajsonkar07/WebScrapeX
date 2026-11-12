import Link from 'next/link';
import { HardDrive, TriangleAlert } from 'lucide-react';
import { setupStatus } from '@/lib/env';

/** Shown on the console when Supabase is not configured (local mode) or partly configured. */
export function SetupNotice() {
    const s = setupStatus();
    const missing = s.items.filter((i) => i.required && !i.ok);
    if (s.mode === 'supabase' && missing.length === 0) return null;

    if (s.mode === 'local') {
        return (
            <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4 sm:flex-row sm:items-center">
                <HardDrive className="size-5 shrink-0 text-warning" />
                <div className="flex-1 text-sm">
                    <p className="font-medium">Local mode — Supabase is not connected</p>
                    <p className="text-foreground/80">
                        Scraping works and history is saved to <span className="font-mono text-[13px]">.data/</span> on this machine. Accounts, cloud storage and multi-user history need the Supabase keys.
                    </p>
                </div>
                <Link href="/setup" className="shrink-0 text-sm font-medium text-primary-ink underline-offset-4 hover:underline">
                    See setup steps
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4 sm:flex-row sm:items-center">
            <TriangleAlert className="size-5 shrink-0 text-warning" />
            <p className="flex-1 text-sm">
                <span className="font-medium">Setup incomplete:</span> {missing.map((m) => m.name).join(', ')} {missing.length === 1 ? 'is' : 'are'} missing. Some features will not work.
            </p>
            <Link href="/setup" className="shrink-0 text-sm font-medium text-primary-ink underline-offset-4 hover:underline">
                Open setup
            </Link>
        </div>
    );
}
