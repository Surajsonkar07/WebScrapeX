'use client';

import { useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);
    return (
        <main id="main" className="grid min-h-[70dvh] place-items-center px-6">
            <div className="max-w-md space-y-4">
                <p className="font-mono text-[13px] text-danger">error{error.digest ? ` · ${error.digest}` : ''}</p>
                <h1 className="text-3xl font-semibold">Something broke on our side.</h1>
                <p className="text-muted-foreground">The page could not load. Your history is safe. Try again, and if it keeps happening check the server log or the Setup page.</p>
                <div className="flex gap-2">
                    <Button onClick={reset}>
                        <RotateCw /> Try again
                    </Button>
                    <Button asChild variant="secondary">
                        <a href="/setup">Open setup</a>
                    </Button>
                </div>
            </div>
        </main>
    );
}
