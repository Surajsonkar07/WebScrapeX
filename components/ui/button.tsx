import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
    'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                primary:
                    'bg-primary text-primary-foreground shadow-[inset_0_-2px_0_oklch(0_0_0/0.14)] hover:brightness-[1.04] hover:shadow-[inset_0_-2px_0_oklch(0_0_0/0.2)]',
                secondary: 'border border-border-strong bg-card text-foreground hover:bg-muted',
                ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
                outline: 'border border-border bg-transparent hover:border-border-strong hover:bg-muted/60',
                danger: 'border border-transparent bg-danger-soft text-danger hover:border-danger/40',
                link: 'h-auto px-0 text-primary-ink underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-9 px-3 text-[13px]',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-5 text-[15px]',
                icon: 'size-10',
                'icon-sm': 'size-9',
            },
        },
        defaultVariants: { variant: 'primary', size: 'md' },
    },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';
