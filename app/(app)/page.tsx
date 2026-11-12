import Link from 'next/link';
import { History } from 'lucide-react';
import { ScrapeConsole } from '@/components/console/scrape-console';
import { JobList } from '@/components/jobs/job-list';
import { EmptyState } from '@/components/ui/misc';
import { SetupNotice } from '@/components/setup-notice';
import { getViewer } from '@/lib/auth';
import { getStore, type Job } from '@/lib/store';

export default async function ConsolePage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
    const [{ url }, viewer] = await Promise.all([searchParams, getViewer().catch(() => null)]);
    let recent: Job[] = [];
    let historyError: string | null = null;
    if (viewer) {
        try {
            recent = (await getStore().listJobs(viewer.id, { limit: 6, offset: 0 })).jobs;
        } catch (e) {
            historyError = (e as Error).message;
        }
    }

    return (
        <div className="space-y-10">
            <SetupNotice />

            <section className="relative">
                <div aria-hidden className="bench-grid pointer-events-none absolute -inset-x-4 -top-6 h-48 [mask-image:linear-gradient(to_bottom,black,transparent)] sm:-inset-x-6 lg:-inset-x-10 lg:-top-10" />
                <div className="relative mb-8 max-w-2xl space-y-3">
                    <p className="label-mono">Console</p>
                    <h1 className="text-[2.1rem] font-semibold sm:text-5xl">
                        Turn a page into <span className="text-primary-ink">rows</span>.
                    </h1>
                    <p className="text-[15px] text-muted-foreground sm:text-base">
                        Paste a URL, pick an audit mode or write CSS selectors, and run it on the server. Every run is saved to your history and exports as CSV or JSON.
                    </p>
                </div>
                <ScrapeConsole initialUrl={url} signedIn={!!viewer} />
            </section>

            <section aria-labelledby="recent-h" className="space-y-4">
                <div className="flex items-end justify-between">
                    <h2 id="recent-h" className="text-xl font-semibold">
                        Recent runs
                    </h2>
                    {recent.length > 0 && (
                        <Link href="/collections" className="text-sm font-medium text-primary-ink underline-offset-4 hover:underline">
                            All history
                        </Link>
                    )}
                </div>
                {historyError ? (
                    <EmptyState icon={<History />} title="History is unavailable">
                        {historyError}
                    </EmptyState>
                ) : recent.length ? (
                    <JobList jobs={recent} compact />
                ) : (
                    <EmptyState icon={<History />} title="No runs yet">
                        Your scrapes will show up here. Try the <strong>Hacker News front page</strong> preset under Fields → Presets for a quick first run.
                    </EmptyState>
                )}
            </section>
        </div>
    );
}
