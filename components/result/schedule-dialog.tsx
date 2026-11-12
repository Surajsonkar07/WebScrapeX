'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { ScrapeOptions } from '@/lib/scraper-types';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/field';
import { Dialog, DialogContent } from '@/components/ui/overlay';
import { cn } from '@/lib/utils';

const schema = z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    webhookUrl: z.union([z.literal(''), z.string().url('Enter a full https:// URL').startsWith('https://', 'Use https')]),
});

export function ScheduleDialog({ open, onOpenChange, url, options }: { open: boolean; onOpenChange: (o: boolean) => void; url: string; options: Omit<ScrapeOptions, 'url'> }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const { register, handleSubmit, watch, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { frequency: 'daily', webhookUrl: '' } });
    const freq = watch('frequency');

    const submit = handleSubmit(async (v) => {
        setBusy(true);
        try {
            const res = await fetch('/api/v2/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, ...options, frequency: v.frequency, webhookUrl: v.webhookUrl }),
            });
            const body = await res.json();
            if (!res.ok) {
                toast.error('Could not create the schedule', { description: body.error });
                return;
            }
            toast.success(`Scheduled ${v.frequency}`, { description: 'Runs when your cron calls /api/cron/schedules.' });
            onOpenChange(false);
            router.push('/schedules');
        } finally {
            setBusy(false);
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent title="Schedule this scrape" description="Re-run with the same mode, engine and selectors.">
                <form onSubmit={submit} className="space-y-5">
                    <p className="truncate rounded-md bg-muted px-3 py-2 font-mono text-[13px]">{url}</p>
                    <fieldset>
                        <legend className="mb-2 text-[13px] font-medium">How often</legend>
                        <div className="grid grid-cols-3 gap-2">
                            {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                                <label key={f} className={cn('flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-border text-sm capitalize has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring', freq === f && 'border-primary bg-primary-soft/60 font-medium')}>
                                    <input type="radio" value={f} {...register('frequency')} className="sr-only" />
                                    {f}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <div className="space-y-1.5">
                        <Label htmlFor="webhook">Webhook (optional)</Label>
                        <Input id="webhook" type="url" placeholder="https://hooks.example.com/scrapes" {...register('webhookUrl')} aria-invalid={!!formState.errors.webhookUrl} />
                        <FieldError>{formState.errors.webhookUrl?.message}</FieldError>
                        <p className="text-[13px] text-muted-foreground">We POST a JSON summary (job id, status, title, rows) after each run.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={busy}>
                            {busy ? 'Saving…' : 'Create schedule'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
