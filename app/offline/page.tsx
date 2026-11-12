import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { LogoMark } from '@/components/brand';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

export default function OfflinePage() {
    return (
        <main id="main" className="grid min-h-dvh place-items-center px-6">
            <div className="max-w-sm space-y-5 text-center">
                <LogoMark className="mx-auto size-10" />
                <div className="mx-auto grid size-12 place-items-center rounded-md border border-border bg-card text-muted-foreground">
                    <WifiOff className="size-5" />
                </div>
                <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
                <p className="text-muted-foreground">Scraping runs on the server, so it needs a connection. Pages you opened recently are still available from the cache.</p>
                <a href="/" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                    Try again
                </a>
            </div>
        </main>
    );
}
