import { AppShell } from '@/components/shell/app-shell';
import { getViewer } from '@/lib/auth';
import { setupStatus } from '@/lib/env';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const viewer = await getViewer().catch(() => null);
    const setupMissing = setupStatus().items.some((i) => i.required && !i.ok);
    return (
        <AppShell
            viewer={viewer ? { email: viewer.email, name: viewer.name, isAdmin: viewer.isAdmin, local: viewer.via === 'local' } : null}
            setupMissing={setupMissing}
        >
            {children}
        </AppShell>
    );
}
