import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { History, Plus } from 'lucide-react';
import { JobList } from '@/components/jobs/job-list';
import { HistoryFilters } from '@/components/jobs/history-filters';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { getViewer } from '@/lib/auth';
import { getStore, type JobStatus } from '@/lib/store';

export const metadata: Metadata = { title: 'History' };

const PER_PAGE = 20;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
    const viewer = await getViewer();
    if (!viewer) redirect('/login?next=/collections');
    const sp = await searchParams;
    const page = Math.max(1, Number(sp.page) || 1);
    const status = (['completed', 'failed', 'scraping'] as JobStatus[]).find((s) => s === sp.status);

    let data: Awaited<ReturnType<ReturnType<typeof getStore>['listJobs']>> = { jobs: [], total: 0 };
    let error: string | null = null;
    try {
        data = await getStore().listJobs(viewer.id, { limit: PER_PAGE, offset: (page - 1) * PER_PAGE, search: sp.q, status });
    } catch (e) {
        error = (e as Error).message;
    }
    const pages = Math.max(1, Math.ceil(data.total / PER_PAGE));
    const qs = (p: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(status ? { status } : {}), page: String(p) })}`;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="History"
                title="Every run, kept"
                description="Open a past run to preview its rows, export CSV or JSON, schedule it, or run it again."
                actions={
                    <Button asChild>
                        <Link href="/">
                            <Plus /> New scrape
                        </Link>
                    </Button>
                }
            />
            <HistoryFilters q={sp.q ?? ''} status={status ?? ''} total={data.total} />
            {error ? (
                <EmptyState icon={<History />} title="History is unavailable">
                    {error}
                </EmptyState>
            ) : data.jobs.length ? (
                <>
                    <JobList jobs={data.jobs} />
                    {pages > 1 && (
                        <nav aria-label="Pagination" className="flex items-center justify-between font-mono text-[13px]">
                            {page > 1 ? <Link className="rounded-md px-3 py-2 hover:bg-muted" href={qs(page - 1)}>← newer</Link> : <span />}
                            <span className="text-muted-foreground">
                                page {page} of {pages}
                            </span>
                            {page < pages ? <Link className="rounded-md px-3 py-2 hover:bg-muted" href={qs(page + 1)}>older →</Link> : <span />}
                        </nav>
                    )}
                </>
            ) : (
                <EmptyState
                    icon={<History />}
                    title={sp.q || status ? 'Nothing matches those filters' : 'No runs yet'}
                    action={
                        <Button asChild variant="secondary">
                            <Link href="/">Run your first scrape</Link>
                        </Button>
                    }
                >
                    {sp.q || status ? 'Try a different search or clear the status filter.' : 'Scrapes you run from the console or the API are listed here.'}
                </EmptyState>
            )}
        </div>
    );
}
