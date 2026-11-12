'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent } from '@/components/ui/overlay';
import { NAV } from './nav';

const GROUP =
    '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase';

export function CommandMenu({ open, onOpenChange, isAdmin }: { open: boolean; onOpenChange: (o: boolean) => void; isAdmin: boolean }) {
    const router = useRouter();
    const { setTheme } = useTheme();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onOpenChange]);

    const go = (href: string) => {
        onOpenChange(false);
        setQuery('');
        router.push(href);
    };
    const looksLikeUrl = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(query.trim());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                title="Jump to"
                className="top-[18%] translate-y-0 gap-0 p-0 [&>div:first-child]:sr-only"
                onOpenAutoFocus={(e) => {
                    // Focus the search box, not the visually hidden close button.
                    e.preventDefault();
                    inputRef.current?.focus();
                }}
            >
                <Command label="Command menu" className="flex flex-col">
                    <Command.Input
                        ref={inputRef}
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Type a page, or paste a URL to scrape…"
                        className="h-12 border-b border-border bg-transparent px-4 text-[15px] outline-none placeholder:text-muted-foreground"
                    />
                    <Command.List className="scroll-slim max-h-80 overflow-y-auto p-1.5">
                        <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing matches.</Command.Empty>
                        {looksLikeUrl && (
                            <Command.Group heading="Scrape" className={GROUP}>
                                <Item onSelect={() => go(`/?url=${encodeURIComponent(query.trim())}`)} value={`scrape ${query}`}>
                                    <Globe /> Scrape <span className="truncate font-mono text-[13px]">{query.trim()}</span>
                                </Item>
                            </Command.Group>
                        )}
                        <Command.Group heading="Pages" className={GROUP}>
                            {NAV.filter((n) => !n.adminOnly || isAdmin).map(({ href, label, icon: Icon }) => (
                                <Item key={href} onSelect={() => go(href)} value={label}>
                                    <Icon /> {label}
                                </Item>
                            ))}
                        </Command.Group>
                        <Command.Group heading="Theme" className={GROUP}>
                            {(['light', 'dark', 'system'] as const).map((t) => (
                                <Item key={t} value={`theme ${t}`} onSelect={() => { setTheme(t); onOpenChange(false); }}>
                                    <span className="w-4" /> Use {t} theme
                                </Item>
                            ))}
                        </Command.Group>
                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
}

function Item({ children, ...props }: React.ComponentProps<typeof Command.Item>) {
    return (
        <Command.Item
            {...props}
            className="group flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm data-[selected=true]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground"
        >
            {children}
            <CornerDownLeft className="ml-auto opacity-0 group-data-[selected=true]:opacity-100" />
        </Command.Item>
    );
}
