import * as React from 'react';
import { cn } from '@/lib/utils';

const control =
    'w-full rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:opacity-60 aria-[invalid=true]:border-danger';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
    <input ref={ref} className={cn(control, 'h-10', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(control, 'min-h-24 py-2.5 leading-relaxed', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
    <select
        ref={ref}
        className={cn(
            control,
            'h-10 appearance-none bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-9',
            "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5 6 7.5 9 4.5' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E\")]",
            className,
        )}
        {...props}
    >
        {children}
    </select>
));
Select.displayName = 'Select';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={cn('text-[13px] font-medium text-foreground', className)} {...props} />;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
    if (!children) return null;
    return (
        <p role="alert" className="text-[13px] text-danger">
            {children}
        </p>
    );
}
