import type { Metadata } from 'next';
import { CircleCheck, CircleDashed, CircleX } from 'lucide-react';
import { Badge, PageHeader } from '@/components/ui/misc';
import { setupStatus } from '@/lib/env';

export const metadata: Metadata = { title: 'Setup', robots: { index: false } };

export default function SetupPage() {
    const s = setupStatus();
    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Setup"
                title={s.mode === 'supabase' ? 'Connected to Supabase' : 'Running in local mode'}
                description={
                    s.mode === 'supabase'
                        ? 'Accounts, history and files live in your Supabase project. The checklist shows which optional features are switched on.'
                        : 'Without Supabase keys the app runs as a single-user workspace and stores everything in .data/ on this machine. Add the keys below to turn on accounts and cloud history.'
                }
                actions={<Badge tone={s.mode === 'supabase' ? 'accent' : 'warning'}>{s.mode} mode</Badge>}
            />

            <section aria-labelledby="env-h" className="space-y-3">
                <h2 id="env-h" className="text-xl font-semibold">Environment variables</h2>
                <p className="text-sm text-muted-foreground">
                    Set these in <span className="font-mono text-[13px]">.env.local</span> for development or in your host&apos;s settings for production, then restart. Values are never shown here — only whether they exist.
                </p>
                <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                    {s.items.map((i) => (
                        <li key={i.name} className="flex items-start gap-3 px-4 py-3">
                            {i.ok ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-accent" /> : i.required ? <CircleX className="mt-0.5 size-5 shrink-0 text-danger" /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}
                            <div className="min-w-0 flex-1">
                                <p className="font-mono text-[13px] break-all">{i.name}</p>
                                <p className="text-[13px] text-muted-foreground">{i.purpose}</p>
                            </div>
                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{i.ok ? 'set' : i.required ? 'required' : 'optional'}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="db-h" className="space-y-3">
                <h2 id="db-h" className="text-xl font-semibold">Database</h2>
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                    <li>
                        In the Supabase dashboard open <strong>SQL Editor</strong> and run <span className="font-mono text-[13px]">supabase/schema.sql</span> from this repository. It is safe to re-run: it creates the v2 tables
                        (<span className="font-mono text-[13px]">api_keys</span>, <span className="font-mono text-[13px]">schedules</span>) and row-level-security policies, and leaves existing v1 data alone.
                    </li>
                    <li>
                        Make sure a Storage bucket named <span className="font-mono text-[13px]">scrapes</span> exists. It can be private: files are served through the app after an ownership check.
                    </li>
                    <li>
                        Under <strong>Authentication → URL configuration</strong>, add <span className="font-mono text-[13px]">https://your-domain/auth/callback</span> as a redirect URL (needed for Google/GitHub sign-in and password reset).
                    </li>
                </ol>
            </section>

            <section aria-labelledby="cron-h" className="space-y-3">
                <h2 id="cron-h" className="text-xl font-semibold">Scheduled runs</h2>
                <p className="text-sm">
                    Set <span className="font-mono text-[13px]">CRON_SECRET</span>, then call <span className="font-mono text-[13px]">GET /api/cron/schedules</span> with <span className="font-mono text-[13px]">Authorization: Bearer &lt;CRON_SECRET&gt;</span>{' '}
                    from any scheduler. On Vercel the included <span className="font-mono text-[13px]">vercel.json</span> does this once a day.
                </p>
            </section>
        </div>
    );
}
