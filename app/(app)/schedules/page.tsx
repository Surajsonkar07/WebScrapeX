import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ScheduleList } from '@/components/schedules/schedule-list';
import { PageHeader } from '@/components/ui/misc';
import { getViewer } from '@/lib/auth';
import { env } from '@/lib/env';
import { getStore, type Schedule } from '@/lib/store';

export const metadata: Metadata = { title: 'Schedules' };

export default async function SchedulesPage() {
    const viewer = await getViewer();
    if (!viewer) redirect('/login?next=/schedules');
    let schedules: Schedule[] = [];
    let error: string | null = null;
    try {
        schedules = await getStore().listSchedules(viewer.id);
    } catch (e) {
        error = (e as Error).message;
    }
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Schedules"
                title="Re-run on a timetable"
                description="Schedules repeat a scrape daily, weekly or monthly with the same selectors, and can POST a summary to your webhook. Create one from any result page."
            />
            {!env.cronSecret && (
                <div className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
                    <p className="font-medium">Automatic runs are off</p>
                    <p className="text-foreground/80">
                        Set <span className="font-mono text-[13px]">CRON_SECRET</span> and have a cron call <span className="font-mono text-[13px]">GET /api/cron/schedules</span> with{' '}
                        <span className="font-mono text-[13px]">Authorization: Bearer &lt;CRON_SECRET&gt;</span> (the included <span className="font-mono text-[13px]">vercel.json</span> does this daily on Vercel). “Run now” works without it.
                    </p>
                </div>
            )}
            <ScheduleList initial={schedules} error={error} />
        </div>
    );
}
