import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { KeyManager } from '@/components/api/key-manager';
import { CodeSamples } from '@/components/api/code-samples';
import { PageHeader } from '@/components/ui/misc';
import { getViewer } from '@/lib/auth';
import { getStore, type ApiKey } from '@/lib/store';

export const metadata: Metadata = { title: 'API keys' };

export default async function ApiAccessPage() {
    const viewer = await getViewer();
    if (!viewer) redirect('/login?next=/api-access');
    let keys: ApiKey[] = [];
    let error: string | null = null;
    try {
        keys = await getStore().listKeys(viewer.id);
    } catch (e) {
        error = (e as Error).message;
    }
    const h = await headers();
    const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'}`;

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="API"
                title="Scrape from your own code"
                description="Every console feature is an HTTP endpoint. Create a key, send it as a Bearer token, and use the same rate limits and robots.txt rules."
            />
            <KeyManager initial={keys} error={error} />
            <CodeSamples origin={origin} />
        </div>
    );
}
