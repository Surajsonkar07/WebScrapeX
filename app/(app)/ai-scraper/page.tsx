import type { Metadata } from 'next';
import { AiExtract } from '@/components/ai/ai-extract';
import { PageHeader } from '@/components/ui/misc';
import { env } from '@/lib/env';

export const metadata: Metadata = { title: 'AI extract' };

export default function AiScraperPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="AI extract"
                title="Describe the data, skip the selectors"
                description={`For messy pages where CSS selectors are brittle: tell the model what you want in plain words and get JSON back. Runs ${env.geminiModel} on the page text after the same robots.txt check.`}
            />
            <AiExtract configured={!!env.googleAiKey} />
        </div>
    );
}
