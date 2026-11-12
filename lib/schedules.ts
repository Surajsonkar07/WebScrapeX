import 'server-only';
import { env } from '@/lib/env';
import { getStore, nextRun, type Schedule } from '@/lib/store';
import { runJob } from '@/lib/scrape/run-job';
import { assertPublicHost } from '@/lib/scrape/safe-fetch';

/** Runs one schedule now and posts a summary to its webhook (if any). */
export async function runSchedule(s: Schedule) {
    const outcome = await runJob({ id: s.userId }, { url: s.url, ...s.options }, true);
    await getStore().markScheduleRun(s.id, outcome.job.id, nextRun(s.frequency));

    if (s.webhookUrl) {
        try {
            const hook = new URL(s.webhookUrl);
            await assertPublicHost(hook);
            await fetch(hook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Agent': env.userAgent },
                signal: AbortSignal.timeout(8000),
                body: JSON.stringify({
                    event: outcome.error ? 'scrape.failed' : 'scrape.completed',
                    scheduleId: s.id,
                    jobId: outcome.job.id,
                    url: s.url,
                    error: outcome.error ?? null,
                    title: outcome.result?.metadata.title ?? null,
                    rows: outcome.result?.fields?.rows ?? null,
                    completedAt: outcome.result?.completedAt ?? new Date().toISOString(),
                }),
            });
        } catch (e) {
            await getStore().log(outcome.job.id, `Webhook delivery failed: ${(e as Error).message}`, 'warning').catch(() => undefined);
        }
    }
    return outcome;
}

export async function runDueSchedules(limit = 3) {
    const due = await getStore().dueSchedules(limit);
    const results = [];
    for (const s of due) {
        const o = await runSchedule(s);
        results.push({ scheduleId: s.id, jobId: o.job.id, status: o.job.status });
    }
    return results;
}
