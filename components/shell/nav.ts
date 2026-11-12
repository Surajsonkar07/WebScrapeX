import { BookOpen, CalendarClock, History, KeyRound, ScanText, Settings2, ShieldCheck, SquareTerminal, Wrench, type LucideIcon } from 'lucide-react';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    /** Shown in the mobile bottom bar. */
    primary?: boolean;
    adminOnly?: boolean;
}

export const NAV: NavItem[] = [
    { href: '/', label: 'Console', icon: SquareTerminal, primary: true },
    { href: '/collections', label: 'History', icon: History, primary: true },
    { href: '/schedules', label: 'Schedules', icon: CalendarClock, primary: true },
    { href: '/ai-scraper', label: 'AI extract', icon: ScanText, primary: true },
    { href: '/api-access', label: 'API keys', icon: KeyRound },
    { href: '/docs', label: 'Docs', icon: BookOpen },
    { href: '/settings', label: 'Settings', icon: Settings2 },
    { href: '/setup', label: 'Setup', icon: Wrench },
    { href: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
];

export const isActive = (pathname: string, href: string) =>
    href === '/' ? pathname === '/' || pathname.startsWith('/result') : pathname === href || pathname.startsWith(`${href}/`);
