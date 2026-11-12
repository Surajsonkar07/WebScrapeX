'use client';

import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

const OPTIONS = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
] as const;

const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

/** Three-way segmented switch: light / dark / system. */
export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();
    return (
        <div role="radiogroup" aria-label="Colour theme" className={cn('inline-flex rounded-md border border-border bg-muted p-0.5', className)}>
            {OPTIONS.map(({ id, label, icon: Icon }) => {
                const on = mounted && theme === id;
                return (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={label}
                        title={label}
                        onClick={() => setTheme(id)}
                        className={cn(
                            'grid h-8 w-9 place-items-center rounded-[5px] text-muted-foreground transition-colors hover:text-foreground',
                            on && 'bg-card text-foreground shadow-[0_1px_2px_oklch(0_0_0/0.12)]',
                        )}
                    >
                        <Icon className="size-4" />
                    </button>
                );
            })}
        </div>
    );
}
