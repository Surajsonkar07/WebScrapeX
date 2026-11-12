import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/settings/settings-form';
import { PageHeader } from '@/components/ui/misc';
import { getViewer } from '@/lib/auth';
import { env } from '@/lib/env';
import { peek } from '@/lib/scrape/rate-limit';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
    const viewer = await getViewer();
    if (!viewer) redirect('/login?next=/settings');
    const minute = peek(`scrape:${viewer.id}`, { limit: env.perMinute, windowMs: 60_000 });
    const hour = peek(`scrape:${viewer.id}`, { limit: env.perHour, windowMs: 3_600_000 });
    return (
        <div className="space-y-8">
            <PageHeader eyebrow="Settings" title="Preferences" description="Theme, scrape defaults and your account." />
            <SettingsForm account={{ email: viewer.email, name: viewer.name, local: viewer.via === 'local' }} quota={{ minute, hour }} />
        </div>
    );
}
