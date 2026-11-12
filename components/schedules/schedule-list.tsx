'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CalendarClock, Loader2, Play, Trash2, Webhook } from 'lucide-react';
import type { Schedule } from '@/lib/store/types';
import { formatDate, hostOf, relativeTime } from '@/lib/format';
import { MODES } from '@/lib/scrape/schema';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { Switch } from '@/components/ui/overlay';

export function ScheduleList({ initial, error }: { initial: Schedule[]; error: string | null }) {
    const router = useRouter();
    const [items, setItems] = useState(initial);
    const [running, setRunning] = useState<string | null>(null);

    if (error) {
        return (
            <EmptyState icon={<CalendarClock />} title="Schedules are unavailable">
                {error}
            </EmptyState>
        );
    }
    if (!items.length) {
        return (
            <EmptyState icon={<CalendarClock />} title="No schedules yet" action={<Button asChild variant="secondary"><Link href="/collections">Pick a run from history</Link></Button>}>
                Open any result and choose <strong>Schedule</strong> to repeat it.
            </EmptyState>
        );
    }

    const toggle = async (s: Schedule, active: boolean) => {
        setItems((xs) => xs.map((x) => (x.id === s.id ? { ...x, active } : x)));
        const res = await fetch(`/api/v2/schedules/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) });
        if (!res.ok) {
            setItems((xs) => xs.map((x) => (x.id === s.id ? { ...x, active: !active } : x)));
            toast.error('Could not update the schedule');
        }
    };

    const remove = async (s: Schedule) => {
        const before = items;
        setItems((xs) => xs.filter((x) => x.id !== s.id));
        const res = await fetch(`/api/v2/schedules/${s.id}`, { method: 'DELETE' });
        if (!res.ok) {
            setItems(before);
            toast.error('Could not delete the schedule');
        } else toast.success('Schedule deleted');
    };

    const runNow = async (s: Schedule) => {
        setRunning(s.id);
        try {
            const res = await fetch(`/api/v2/schedules/${s.id}/run`, { method: 'POST' });
            const body = await res.json();
            if (!res.ok) toast.error(body.error ?? 'Run failed');
            else if (body.status === 'failed') toast.error('The run failed', { description: body.error, action: { label: 'Open', onClick: () => router.push(`/result/${body.id}`) } });
            else toast.success('Run finished', { action: { label: 'Open', onClick: () => router.push(`/result/${body.id}`) } });
            router.refresh();
        } finally {
            setRunning(null);
        }
    };

    return (
        <ul className="grid gap-3 md:grid-cols-2">
            <AnimatePresence initial={false}>
                {items.map((s, i) => (
                    <m.li key={s.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} exit={{ opacity: 0, scale: 0.98 }} className="panel flex flex-col gap-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate font-medium">{hostOf(s.url)}</p>
                                <p className="truncate font-mono text-[12px] text-muted-foreground">{s.url}</p>
                            </div>
                            <Switch checked={s.active} onCheckedChange={(v) => toggle(s, v)} aria-label={s.active ? 'Pause schedule' : 'Resume schedule'} />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <Badge tone="primary">{s.frequency}</Badge>
                            <Badge>{MODES.find((x) => x.id === s.options.mode)?.label ?? s.options.mode}</Badge>
                            <Badge>{s.options.engine}</Badge>
                            {s.options.fields?.length ? <Badge>{s.options.fields.length} fields</Badge> : null}
                            {s.webhookUrl && (
                                <Badge tone="accent">
                                    <Webhook className="size-3" /> webhook
                                </Badge>
                            )}
                        </div>
                        <dl className="grid grid-cols-2 gap-2 font-mono text-[12px]">
                            <div>
                                <dt className="text-muted-foreground">next run</dt>
                                <dd suppressHydrationWarning>{s.active ? formatDate(s.nextRunAt) : 'paused'}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">last run</dt>
                                <dd suppressHydrationWarning>
                                    {s.lastJobId ? (
                                        <Link href={`/result/${s.lastJobId}`} className="text-primary-ink hover:underline">
                                            {relativeTime(s.lastRunAt)}
                                        </Link>
                                    ) : (
                                        'never'
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <div className="mt-auto flex gap-2 border-t border-border pt-3">
                            <Button variant="secondary" size="sm" onClick={() => runNow(s)} disabled={running === s.id}>
                                {running === s.id ? <Loader2 className="animate-spin" /> : <Play />} Run now
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => remove(s)} className="ml-auto text-danger hover:text-danger">
                                <Trash2 /> Delete
                            </Button>
                        </div>
                    </m.li>
                ))}
            </AnimatePresence>
        </ul>
    );
}
