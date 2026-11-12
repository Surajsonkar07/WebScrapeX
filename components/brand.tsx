import { cn } from '@/lib/utils';

/** Capture-frame monogram: four corner brackets around a sample point. */
export function LogoMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
            <rect width="32" height="32" rx="7" className="fill-primary" />
            <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" className="text-primary-foreground">
                <path d="M8 13V8h5M19 8h5v5M24 19v5h-5M13 24H8v-5" />
            </g>
            <rect x="13.5" y="13.5" width="5" height="5" rx="1" className="fill-primary-foreground" />
        </svg>
    );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
    return (
        <span className={cn('inline-flex items-center gap-2.5', className)}>
            <LogoMark />
            {!compact && (
                <span className="font-display text-[17px] font-semibold tracking-[-0.03em]">
                    WebScrape<span className="text-primary-ink">X</span>
                </span>
            )}
        </span>
    );
}
