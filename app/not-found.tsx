import Link from 'next/link';
import { LogoMark } from '@/components/brand';

export default function NotFound() {
    return (
        <main id="main" className="grid min-h-dvh place-items-center px-6">
            <div className="max-w-md space-y-5">
                <LogoMark className="size-10" />
                <p className="font-mono text-[13px] text-muted-foreground">HTTP 404 · nothing at this address</p>
                <h1 className="text-3xl font-semibold">This page (or job) doesn&apos;t exist.</h1>
                <p className="text-muted-foreground">It may have been deleted, or it belongs to a different account.</p>
                <div className="flex flex-wrap gap-2">
                    <Link href="/" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                        Open the console
                    </Link>
                    <Link href="/collections" className="inline-flex h-10 items-center rounded-md border border-border-strong px-4 text-sm font-medium">
                        View history
                    </Link>
                </div>
            </div>
        </main>
    );
}
