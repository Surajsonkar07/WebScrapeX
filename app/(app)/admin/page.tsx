import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { CountUp } from '@/components/result/count-up';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { getViewer } from '@/lib/auth';
import { relativeTime } from '@/lib/format';
import { getStore, type Stats } from '@/lib/store';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };

export default async function AdminPage() {
    const viewer = await getViewer();
    if (!viewer) redirect('/login?next=/admin');
    if (!viewer.isAdmin) {
        return (
            <EmptyState icon={<ShieldCheck />} title="Admins only">
                Ask the operator to add your email to <span className="font-mono">ADMIN_EMAILS</span> on the server.
            </EmptyState>
        );
    }

    let stats: Stats | null = null;
    let error: string | null = null;
    try {
        stats = await getStore().stats();
    } catch (e) {
        error = (e as Error).message;
    }

    return (
        <div className="space-y-8">
            <PageHeader eyebrow="Admin" title="Service overview" description="All users' jobs, from the service-role connection." />
            {error || !stats ? (
                <EmptyState icon={<ShieldCheck />} title="Stats are unavailable">{error}</EmptyState>
            ) : (
                <>
                    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-5">
                        {[
                            ['jobs', stats.jobs],
                            ['completed', stats.completed],
                            ['failed', stats.failed],
                            ['last 24h', stats.last24h],
                            ['users', stats.users],
                        ].map(([label, value]) => (
                            <div key={label as string} className="bg-card p-5">
                                <dt className="label-mono">{label}</dt>
                                <dd className="mt-2 font-display text-3xl font-semibold tabular-nums">{value === null ? '—' : <CountUp value={value as number} />}</dd>
                            </div>
                        ))}
                    </dl>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="panel p-5">
                            <h2 className="label-mono mb-4">Most scraped hosts</h2>
                            <ul className="space-y-2.5">
                                {stats.topHosts.map((h) => (
                                    <li key={h.host} className="space-y-1">
                                        <div className="flex justify-between font-mono text-[13px]">
                                            <span className="truncate">{h.host}</span>
                                            <span className="text-muted-foreground">{h.count}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted">
                                            <div className="h-full rounded-full bg-primary" style={{ width: `${(h.count / Math.max(1, stats!.topHosts[0].count)) * 100}%` }} />
                                        </div>
                                    </li>
                                ))}
                                {!stats.topHosts.length && <li className="text-sm text-muted-foreground">No jobs yet.</li>}
                            </ul>
                        </section>
                        <section className="panel p-5">
                            <h2 className="label-mono mb-4">Recent failures</h2>
                            <ul className="divide-y divide-border">
                                {stats.recentFailures.map((f) => (
                                    <li key={f.id} className="py-2.5">
                                        <p className="truncate font-mono text-[13px]">{f.url}</p>
                                        <p className="text-[13px] text-danger">{f.error ?? 'failed'}</p>
                                        <p className="font-mono text-[11px] text-muted-foreground" suppressHydrationWarning>{relativeTime(f.createdAt)}</p>
                                    </li>
                                ))}
                                {!stats.recentFailures.length && <li className="text-sm text-muted-foreground">Nothing has failed recently.</li>}
                            </ul>
                        </section>
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                        Health endpoint: <Link href="/api/health" className="font-mono text-primary-ink hover:underline">/api/health</Link>
                    </p>
                </>
            )}
        </div>
    );
}
