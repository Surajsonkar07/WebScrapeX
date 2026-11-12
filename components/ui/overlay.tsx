'use client';

import * as React from 'react';
import { Dialog as D, DropdownMenu as DM, Tabs as T, Switch as S, Tooltip as TT } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------- Dialog & Sheet ---------- */

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
    className,
    children,
    title,
    description,
    side,
    ...props
}: React.ComponentProps<typeof D.Content> & { title: string; description?: string; side?: 'bottom' | 'right' }) {
    return (
        <D.Portal>
            <D.Overlay className="fixed inset-0 z-50 bg-[oklch(0.15_0.01_255/0.45)] backdrop-blur-[2px] dlg-fade" />
            <D.Content
                className={cn(
                    'dlg-pop fixed z-50 flex flex-col gap-4 border border-border bg-card p-5 shadow-panel outline-none',
                    side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl pb-[max(1.25rem,env(safe-area-inset-bottom))]',
                    side === 'right' && 'inset-y-0 right-0 w-[min(88vw,360px)] rounded-l-xl',
                    !side && 'top-1/2 left-1/2 max-h-[90dvh] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl',
                    className,
                )}
                {...props}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <D.Title className="font-display text-lg font-semibold">{title}</D.Title>
                        {description ? (
                            <D.Description className="text-sm text-muted-foreground">{description}</D.Description>
                        ) : (
                            <D.Description className="sr-only">{title}</D.Description>
                        )}
                    </div>
                    <D.Close className="-m-1 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
                        <X className="size-4" />
                    </D.Close>
                </div>
                {children}
            </D.Content>
        </D.Portal>
    );
}

/* ---------- Dropdown menu ---------- */

export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;

export function MenuContent({ className, ...props }: React.ComponentProps<typeof DM.Content>) {
    return (
        <DM.Portal>
            <DM.Content
                sideOffset={6}
                align="end"
                className={cn('z-50 min-w-52 rounded-lg border border-border bg-card p-1 shadow-panel', className)}
                {...props}
            />
        </DM.Portal>
    );
}

export function MenuItem({ className, ...props }: React.ComponentProps<typeof DM.Item>) {
    return (
        <DM.Item
            className={cn(
                'flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground',
                className,
            )}
            {...props}
        />
    );
}

export function MenuLabel({ className, ...props }: React.ComponentProps<typeof DM.Label>) {
    return <DM.Label className={cn('label-mono px-2.5 pt-2 pb-1', className)} {...props} />;
}

export const MenuSeparator = () => <DM.Separator className="my-1 h-px bg-border" />;

/* ---------- Tabs ---------- */

export const Tabs = T.Root;
export const TabsContent = T.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
    return <T.List className={cn('-mx-1 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
    return (
        <T.Trigger
            className={cn(
                'relative -mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground [&_svg]:size-4',
                className,
            )}
            {...props}
        />
    );
}

/* ---------- Switch ---------- */

export function Switch({ className, ...props }: React.ComponentProps<typeof S.Root>) {
    return (
        <S.Root
            className={cn(
                'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-border-strong bg-muted transition-colors data-[state=checked]:border-transparent data-[state=checked]:bg-primary',
                className,
            )}
            {...props}
        >
            <S.Thumb className="block size-[18px] translate-x-[2px] rounded-full bg-card shadow transition-transform duration-150 data-[state=checked]:translate-x-[18px]" />
        </S.Root>
    );
}

/* ---------- Tooltip ---------- */

export const TooltipProvider = TT.Provider;

export function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
    return (
        <TT.Root delayDuration={250}>
            <TT.Trigger asChild>{children}</TT.Trigger>
            <TT.Portal>
                <TT.Content sideOffset={6} className="z-50 rounded-md bg-foreground px-2 py-1 text-xs text-background">
                    {content}
                </TT.Content>
            </TT.Portal>
        </TT.Root>
    );
}
