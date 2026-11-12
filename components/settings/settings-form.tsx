'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label, Select } from '@/components/ui/field';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { MODES } from '@/lib/scrape/schema';

const KEY = 'wsx:defaults';

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-[13px] text-muted-foreground">{hint}</p>
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

export function SettingsForm({ account, quota }: { account: { email: string; name: string | null; local: boolean }; quota: { minute: { used: number; limit: number }; hour: { used: number; limit: number } } }) {
    const [mode, setMode] = useState('full');
    const [engine, setEngine] = useState('static');

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
            if (saved.mode) setMode(saved.mode);
            if (saved.engine) setEngine(saved.engine);
        } catch {
            /* ignore */
        }
    }, []);

    const save = (next: { mode?: string; engine?: string }) => {
        const value = { mode, engine, ...next };
        localStorage.setItem(KEY, JSON.stringify(value));
        if (next.mode) setMode(next.mode);
        if (next.engine) setEngine(next.engine);
        toast.success('Default saved', { description: 'New scrapes in the console start with it.' });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <section className="panel px-5 py-2">
                <h2 className="label-mono pt-3">Appearance</h2>
                <div className="divide-y divide-border">
                    <Row title="Theme" hint="Light, dark, or follow your system setting.">
                        <ThemeToggle />
                    </Row>
                </div>
            </section>

            <section className="panel px-5 py-2">
                <h2 className="label-mono pt-3">Scrape defaults · this browser</h2>
                <div className="divide-y divide-border">
                    <Row title="Default mode" hint="Pre-selected when you open the console.">
                        <Label htmlFor="def-mode" className="sr-only">Default mode</Label>
                        <Select id="def-mode" value={mode} onChange={(e) => save({ mode: e.target.value })} className="w-44">
                            {MODES.map((m) => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </Select>
                    </Row>
                    <Row title="Default engine" hint="Rendered runs JavaScript but is slower.">
                        <Label htmlFor="def-engine" className="sr-only">Default engine</Label>
                        <Select id="def-engine" value={engine} onChange={(e) => save({ engine: e.target.value })} className="w-44">
                            <option value="static">Static</option>
                            <option value="rendered">Rendered</option>
                        </Select>
                    </Row>
                </div>
            </section>

            <section className="panel px-5 py-2">
                <h2 className="label-mono pt-3">Usage</h2>
                <div className="divide-y divide-border">
                    <Row title="Scrapes this minute" hint="Resets on a rolling 60-second window.">
                        <span className="font-mono text-sm">{quota.minute.used} / {quota.minute.limit}</span>
                    </Row>
                    <Row title="Scrapes this hour" hint="Rolling 60-minute window.">
                        <span className="font-mono text-sm">{quota.hour.used} / {quota.hour.limit}</span>
                    </Row>
                </div>
            </section>

            <section className="panel px-5 py-2">
                <h2 className="label-mono pt-3">Account</h2>
                <div className="divide-y divide-border">
                    {account.local ? (
                        <Row title="Local workspace" hint="Supabase is not configured, so there are no accounts. Everything is stored in .data/ on this machine.">
                            <Button asChild variant="secondary" size="sm"><Link href="/setup">Connect Supabase</Link></Button>
                        </Row>
                    ) : (
                        <>
                            <Row title={account.name || 'Signed in'} hint={account.email}>
                                <form action="/auth/signout" method="post">
                                    <Button type="submit" variant="secondary" size="sm">
                                        <LogOut /> Sign out
                                    </Button>
                                </form>
                            </Row>
                            <Row title="Password" hint="We email you a reset link.">
                                <Button asChild variant="outline" size="sm"><Link href="/forgot-password">Change password</Link></Button>
                            </Row>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
