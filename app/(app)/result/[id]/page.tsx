import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ResultView } from '@/components/result/result-view';
import { AutoRefresh } from '@/components/result/auto-refresh';
import { getViewer } from '@/lib/auth';
import { hostOf } from '@/lib/format';
import { getStore } from '@/lib/store';

export const metadata: Metadata = { title: 'Result', robots: { index: false } };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const viewer = await getViewer();
    if (!viewer) redirect(`/login?next=/result/${id}`);

    const store = getStore();
    const job = await store.getJob(viewer.id, id);
    if (!job) notFound();
    const [result, logs] = await Promise.all([store.getResult(viewer.id, id), store.getLogs(viewer.id, id)]);

    return (
        <>
            {(job.status === 'scraping' || job.status === 'pending') && <AutoRefresh label={`Still scraping ${hostOf(job.url)}…`} />}
            <ResultView job={job} result={result} logs={logs} />
        </>
    );
}
