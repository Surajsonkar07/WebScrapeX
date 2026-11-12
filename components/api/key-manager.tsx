'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Check, Copy, KeyRound, Plus, Trash2 } from 'lucide-react';
import type { ApiKey } from '@/lib/store/types';
import { relativeTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/misc';

export function KeyManager({ initial, error }: { initial: ApiKey[]; error: string | null }) {
    const [keys, setKeys] = useState(initial);
    const [name, setName] = useState('');
    const [secret, setSecret] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);

    if (error) {
        return (
            <EmptyState icon={<KeyRound />} title="API keys are unavailable">
                {error}
            </EmptyState>
        );
    }

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await fetch('/api/v2/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() || 'Default' }) });
            const body = await res.json();
            if (!res.ok) {
                toast.error(body.error ?? 'Could not create a key');
                return;
            }
            setKeys((k) => [body.key, ...k]);
            setSecret(body.secret);
            setName('');
        } finally {
            setBusy(false);
        }
    };

    const revoke = async (k: ApiKey) => {
        if (!confirm(`Revoke “${k.name}”? Requests using it will start failing immediately.`)) return;
        const res = await fetch(`/api/v2/keys/${k.id}`, { method: 'DELETE' });
        if (res.ok) {
            setKeys((xs) => xs.filter((x) => x.id !== k.id));
            toast.success('Key revoked');
        } else toast.error('Could not revoke the key');
    };

    const copy = async () => {
        if (!secret) return;
        await navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <section aria-labelledby="keys-h" className="space-y-4">
            <h2 id="keys-h" className="text-xl font-semibold">
                Keys
            </h2>

            <AnimatePresence>
                {secret && (
                    <m.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 rounded-lg border border-accent/40 bg-accent-soft p-4" role="status">
                        <p className="text-sm font-medium">Copy your new key now — it will not be shown again.</p>
                        <div className="flex gap-2">
                            <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-card px-3 py-2 font-mono text-[13px]">{secret}</code>
                            <Button variant="secondary" onClick={copy} aria-label="Copy key">
                                {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                        <button type="button" onClick={() => setSecret(null)} className="text-[13px] text-muted-foreground underline-offset-4 hover:underline">
                            I&apos;ve stored it
                        </button>
                    </m.div>
                )}
            </AnimatePresence>

            <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5 sm:max-w-sm">
                    <Label htmlFor="key-name">Key name</Label>
                    <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="n8n workflow, cron job…" maxLength={60} />
                </div>
                <Button type="submit" disabled={busy || keys.length >= 10}>
                    <Plus /> Create key
                </Button>
            </form>

            {keys.length ? (
                <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                    {keys.map((k) => (
                        <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                            <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{k.name}</p>
                                <p className="font-mono text-[12px] text-muted-foreground" suppressHydrationWarning>
                                    {k.prefix}… · created {relativeTime(k.createdAt)} · {k.lastUsedAt ? `used ${relativeTime(k.lastUsedAt)}` : 'never used'}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon-sm" aria-label={`Revoke ${k.name}`} onClick={() => revoke(k)}>
                                <Trash2 />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No keys yet. Keys are stored as SHA-256 hashes; you can have up to 10.</p>
            )}
        </section>
    );
}
