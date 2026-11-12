'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogIn, LogOut, Menu as MenuIcon, Search } from 'lucide-react';
import { Logo, LogoMark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/misc';
import { Dialog, DialogContent } from '@/components/ui/overlay';
import { cn } from '@/lib/utils';
import { isActive, NAV } from './nav';
import { ThemeToggle } from './theme-toggle';

const CommandMenu = dynamic(() => import('./command-menu').then((m) => m.CommandMenu), { ssr: false });

export interface ShellViewer {
    email: string;
    name: string | null;
    isAdmin: boolean;
    local: boolean;
}

function NavLinks({ viewer, setupMissing, onNavigate }: { viewer: ShellViewer | null; setupMissing: boolean; onNavigate?: () => void }) {
    const pathname = usePathname();
    return (
        <ul className="space-y-0.5">
            {NAV.filter((n) => !n.adminOnly || viewer?.isAdmin).map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                    <li key={href}>
                        <Link
                            href={href}
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                                active && 'bg-muted font-medium text-foreground',
                            )}
                        >
                            {active && <span aria-hidden className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-primary" />}
                            <Icon className={cn('size-[18px]', active ? 'text-primary-ink' : 'text-muted-foreground group-hover:text-foreground')} />
                            {label}
                            {href === '/setup' && setupMissing && <span className="ml-auto size-2 rounded-full bg-warning" aria-label="needs attention" />}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function Account({ viewer }: { viewer: ShellViewer | null }) {
    if (!viewer) {
        return (
            <Button asChild variant="secondary" className="w-full">
                <Link href="/login">
                    <LogIn /> Sign in
                </Link>
            </Button>
        );
    }
    const initials = (viewer.name || viewer.email).slice(0, 2).toUpperCase();
    return (
        <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted font-mono text-xs font-medium">{initials}</span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{viewer.name || (viewer.local ? 'Local workspace' : viewer.email.split('@')[0])}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{viewer.local ? 'no account needed' : viewer.email}</p>
            </div>
            {!viewer.local && (
                <form action="/auth/signout" method="post">
                    <button type="submit" aria-label="Sign out" title="Sign out" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                        <LogOut className="size-4" />
                    </button>
                </form>
            )}
        </div>
    );
}

export function AppShell({ viewer, setupMissing, children }: { viewer: ShellViewer | null; setupMissing: boolean; children: React.ReactNode }) {
    const pathname = usePathname();
    const [sheet, setSheet] = useState(false);
    const [cmd, setCmd] = useState(false);
    const primary = NAV.filter((n) => n.primary);

    return (
        <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
            {/* Desktop rail */}
            <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card/60 px-3 py-4 lg:flex">
                <Link href="/" className="mb-6 flex h-10 items-center rounded-md px-2" aria-label="WebScrapeX home">
                    <Logo />
                </Link>
                <button
                    type="button"
                    onClick={() => setCmd(true)}
                    className="mb-4 flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong"
                >
                    <Search className="size-4" />
                    Jump to…
                    <span className="ml-auto flex gap-1">
                        <Kbd>Ctrl</Kbd>
                        <Kbd>K</Kbd>
                    </span>
                </button>
                <nav aria-label="Main" className="flex-1 overflow-y-auto pl-3">
                    <NavLinks viewer={viewer} setupMissing={setupMissing} />
                </nav>
                <div className="space-y-4 border-t border-border pt-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="label-mono">Theme</span>
                        <ThemeToggle />
                    </div>
                    <Account viewer={viewer} />
                </div>
            </aside>

            <div className="flex min-w-0 flex-col">
                {/* Mobile top bar */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
                    <Link href="/" aria-label="WebScrapeX home">
                        <Logo />
                    </Link>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label="Search pages" onClick={() => setCmd(true)}>
                            <Search />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setSheet(true)}>
                            <MenuIcon />
                        </Button>
                    </div>
                </header>

                <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
                    {children}
                </main>
            </div>

            {/* Mobile bottom tab bar */}
            <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
                <ul className="grid grid-cols-5">
                    {primary.map(({ href, label, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground', active && 'text-foreground')}
                                >
                                    <Icon className={cn('size-5', active && 'text-primary-ink')} />
                                    {label.split(' ')[0]}
                                </Link>
                            </li>
                        );
                    })}
                    <li>
                        <button type="button" onClick={() => setSheet(true)} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground">
                            <MenuIcon className="size-5" />
                            More
                        </button>
                    </li>
                </ul>
            </nav>

            <Dialog open={sheet} onOpenChange={setSheet}>
                <DialogContent side="bottom" title="Menu" className="overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <LogoMark />
                        <ThemeToggle />
                    </div>
                    <nav aria-label="Mobile">
                        <NavLinks viewer={viewer} setupMissing={setupMissing} onNavigate={() => setSheet(false)} />
                    </nav>
                    <div className="border-t border-border pt-4">
                        <Account viewer={viewer} />
                    </div>
                </DialogContent>
            </Dialog>

            <CommandMenu open={cmd} onOpenChange={setCmd} isAdmin={!!viewer?.isAdmin} />
        </div>
    );
}
