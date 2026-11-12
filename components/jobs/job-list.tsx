'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ArrowUpRight, FileDown, MoreHorizontal, RotateCw, Trash2 } from 'lucide-react';
import type { Job } from '@/lib/store/types';
import { hostOf, relativeTime } from '@/lib/format';
import { MODES } from '@/lib/scrape/schema';
import { Badge, StatusDot } from '@/components/ui/misc';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/overlay';

const modeLabel = (id: string) => MODES.find((m) => m.id === id)?.label ?? id;

export function JobList({ jobs, compact = false }: { jobs: Job[]; compact?: boolean }) {
    const router = useRouter();
    const [, start] = useTransition();
    const [visible, removeOptimistic] = useOptimistic(jobs, (state, id: string) => state.filter((j) => j.id !== id));

    const remove = (job: Job) =>
        start(async () => {
            removeOptimistic(job.id);
            const res = await fetch(`/api/v2/jobs/${job.id}`, { method: 'DELETE' });
            if (res.ok) toast.success('Job deleted', { description: hostOf(job.url) });
            else toast.error('Could not delete the job');
            router.refresh();
        });

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            {/* Column heads (desktop) */}
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_90px_110px_44px] gap-4 border-b border-border bg-muted/50 px-4 py-2 md:grid">
                <span className="label-mono">Page</span>
                <span className="label-mono">Mode</span>
                <span className="label-mono text-right">Rows</span>
                <span className="label-mono text-right">When</span>
                <span className="sr-only">Actions</span>
            </div>
            <ul>
                <AnimatePresence initial={false}>
                    {visible.map((job, i) => (
                        <m.li
                            key={job.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.025 } }}
                            exit={{ opacity: 0, height: 0 }}
                            className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_120px_90px_110px_44px]"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <StatusDot status={job.status} />
                                <div className="min-w-0">
                                    <Link href={`/result/${job.id}`} className="block truncate text-sm font-medium after:absolute after:inset-0 hover:text-primary-ink">
                                        {job.title || hostOf(job.url)}
                                    </Link>
                                    <p className="truncate font-mono text-[12px] text-muted-foreground">{job.status === 'failed' && job.error ? <span className="text-danger">{job.error}</span> : job.url}</p>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <Badge>{modeLabel(job.mode)}</Badge>
                            </div>
                            <span className="hidden text-right font-mono text-[13px] tabular-nums md:block">{job.rows ?? '—'}</span>
                            <time dateTime={job.createdAt} className={compact ? 'text-right font-mono text-[12px] text-muted-foreground' : 'hidden text-right font-mono text-[12px] text-muted-foreground md:block'} suppressHydrationWarning>
                                {relativeTime(job.createdAt)}
                            </time>
                            {!compact && (
                                <div className="relative z-10 justify-self-end">
                                    <Menu>
                                        <MenuTrigger className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Actions for ${hostOf(job.url)}`}>
                                            <MoreHorizontal className="size-4" />
                                        </MenuTrigger>
                                        <MenuContent>
                                            <MenuItem onSelect={() => router.push(`/result/${job.id}`)}>
                                                <ArrowUpRight /> Open
                                            </MenuItem>
                                            <MenuItem onSelect={() => router.push(`/?url=${encodeURIComponent(job.url)}`)}>
                                                <RotateCw /> Scrape again
                                            </MenuItem>
                                            {job.status === 'completed' && (
                                                <MenuItem asChild>
                                                    <a href={`/api/v2/jobs/${job.id}/export?format=json`} download>
                                                        <FileDown /> Download JSON
                                                    </a>
                                                </MenuItem>
                                            )}
                                            <MenuSeparator />
                                            <MenuItem onSelect={() => remove(job)} className="text-danger [&_svg]:text-danger">
                                                <Trash2 /> Delete
                                            </MenuItem>
                                        </MenuContent>
                                    </Menu>
                                </div>
                            )}
                        </m.li>
                    ))}
                </AnimatePresence>
            </ul>
        </div>
    );
}
