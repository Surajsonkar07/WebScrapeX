'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { m, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { useAppMode } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/field';
import { supabaseBrowser } from '@/lib/supabase/client';

function Heading({ title, sub }: { title: string; sub: React.ReactNode }) {
    return (
        <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="text-muted-foreground">{sub}</p>
        </div>
    );
}

function LocalModeNotice() {
    return (
        <div className="space-y-4">
            <Heading title="Accounts are off" sub="Supabase is not configured, so WebScrapeX runs as a single local workspace — no sign-in needed." />
            <div className="flex flex-wrap gap-2">
                <Button asChild>
                    <Link href="/">Open the console</Link>
                </Button>
                <Button asChild variant="secondary">
                    <Link href="/setup">How to connect Supabase</Link>
                </Button>
            </div>
        </div>
    );
}

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/');

function GoogleButton({ next }: { next: string }) {
    const [busy, setBusy] = useState(false);
    return (
        <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={async () => {
                setBusy(true);
                const { error } = await supabaseBrowser().auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
                });
                if (error) {
                    toast.error('Google sign-in is not available', { description: error.message });
                    setBusy(false);
                }
            }}
        >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
                <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1A11 11 0 0 0 1 12c0 1.8.4 3.4 1.1 4.9L5.8 14Z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1L5.8 10c.9-2.7 3.3-4.6 6.2-4.6Z" />
            </svg>
            Continue with Google
        </Button>
    );
}

function Divider() {
    return (
        <div className="my-6 flex items-center gap-3 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
        </div>
    );
}

/* ---------------- Login ---------------- */

const loginSchema = z.object({ email: z.string().trim().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });

export function LoginForm() {
    const mode = useAppMode();
    const router = useRouter();
    const params = useSearchParams();
    const next = safeNext(params.get('next'));
    const { register, handleSubmit, formState, setError } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

    if (mode === 'local') return <LocalModeNotice />;

    const onSubmit = handleSubmit(async (v) => {
        const { error } = await supabaseBrowser().auth.signInWithPassword({ email: v.email, password: v.password });
        if (error) {
            setError('password', { message: error.message === 'Invalid login credentials' ? 'That email and password do not match.' : error.message });
            return;
        }
        router.replace(next);
        router.refresh();
    });

    return (
        <div>
            <Heading title="Sign in" sub={<>New here? <Link href={`/signup${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-primary-ink underline-offset-4 hover:underline">Create an account</Link></>} />
            {params.get('error') && <p role="alert" className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{params.get('error')}</p>}
            <GoogleButton next={next} />
            <Divider />
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!formState.errors.email} />
                    <FieldError>{formState.errors.email?.message}</FieldError>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password" className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Forgot it?</Link>
                    </div>
                    <Input id="password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={!!formState.errors.password} />
                    <FieldError>{formState.errors.password?.message}</FieldError>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
                    {formState.isSubmitting && <Loader2 className="animate-spin" />} Sign in
                </Button>
            </form>
        </div>
    );
}

/* ---------------- Sign-up (email → 6-digit code → account) ---------------- */

const detailsSchema = z.object({
    fullName: z.string().trim().min(2, 'Tell us your name').max(80),
    email: z.string().trim().email('Enter a valid email'),
    password: z.string().min(8, 'Use at least 8 characters').max(128),
});
const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code') });

export function SignupForm() {
    const mode = useAppMode();
    const router = useRouter();
    const params = useSearchParams();
    const next = safeNext(params.get('next'));
    const [details, setDetails] = useState<z.infer<typeof detailsSchema> | null>(null);
    const [resending, setResending] = useState(false);
    const d = useForm<z.infer<typeof detailsSchema>>({ resolver: zodResolver(detailsSchema) });
    const c = useForm<z.infer<typeof codeSchema>>({ resolver: zodResolver(codeSchema) });

    if (mode === 'local') return <LocalModeNotice />;

    const sendCode = async (v: z.infer<typeof detailsSchema>) => {
        const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: v.email, fullName: v.fullName }) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return body.error ?? 'Could not send the code.';
        if (body.simulated) toast('Email is not configured', { description: 'The code was written to the server log (development only).' });
        return null;
    };

    const submitDetails = d.handleSubmit(async (v) => {
        const err = await sendCode(v);
        if (err) {
            d.setError('email', { message: err });
            return;
        }
        setDetails(v);
    });

    const submitCode = c.handleSubmit(async ({ code }) => {
        if (!details) return;
        const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...details, code }) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            c.setError('code', { message: body.error ?? 'Verification failed.' });
            return;
        }
        const { error } = await supabaseBrowser().auth.signInWithPassword({ email: details.email, password: details.password });
        toast.success('Account created');
        if (error) router.replace('/login');
        else {
            router.replace(next);
            router.refresh();
        }
    });

    return (
        <AnimatePresence mode="wait" initial={false}>
            {!details ? (
                <m.div key="details" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                    <Heading title="Create your account" sub={<>Already have one? <Link href="/login" className="font-medium text-primary-ink underline-offset-4 hover:underline">Sign in</Link></>} />
                    <GoogleButton next={next} />
                    <Divider />
                    <form onSubmit={submitDetails} className="space-y-4" noValidate>
                        <div className="space-y-1.5">
                            <Label htmlFor="fullName">Name</Label>
                            <Input id="fullName" autoComplete="name" {...d.register('fullName')} aria-invalid={!!d.formState.errors.fullName} />
                            <FieldError>{d.formState.errors.fullName?.message}</FieldError>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="su-email">Email</Label>
                            <Input id="su-email" type="email" autoComplete="email" {...d.register('email')} aria-invalid={!!d.formState.errors.email} />
                            <FieldError>{d.formState.errors.email?.message}</FieldError>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="su-password">Password</Label>
                            <Input id="su-password" type="password" autoComplete="new-password" {...d.register('password')} aria-invalid={!!d.formState.errors.password} />
                            <FieldError>{d.formState.errors.password?.message}</FieldError>
                        </div>
                        <Button type="submit" size="lg" className="w-full" disabled={d.formState.isSubmitting}>
                            {d.formState.isSubmitting && <Loader2 className="animate-spin" />} Email me a code
                        </Button>
                        <p className="text-[13px] text-muted-foreground">We send a 6-digit code to confirm the address. Your account is only created once the code checks out.</p>
                    </form>
                </m.div>
            ) : (
                <m.div key="code" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                    <div className="mb-6 grid size-11 place-items-center rounded-md bg-accent-soft text-accent-ink">
                        <MailCheck className="size-5" />
                    </div>
                    <Heading title="Check your inbox" sub={<>Enter the code we sent to <span className="font-medium text-foreground">{details.email}</span>. It expires in 15 minutes.</>} />
                    <form onSubmit={submitCode} className="space-y-4" noValidate>
                        <div className="space-y-1.5">
                            <Label htmlFor="code">6-digit code</Label>
                            <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus {...c.register('code')} className="h-14 text-center font-mono text-2xl tracking-[0.5em]" aria-invalid={!!c.formState.errors.code} />
                            <FieldError>{c.formState.errors.code?.message}</FieldError>
                        </div>
                        <Button type="submit" size="lg" className="w-full" disabled={c.formState.isSubmitting}>
                            {c.formState.isSubmitting && <Loader2 className="animate-spin" />} Verify and create account
                        </Button>
                        <div className="flex items-center justify-between text-[13px]">
                            <button type="button" onClick={() => setDetails(null)} className="inline-flex min-h-9 items-center gap-1 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="size-3.5" /> Change email
                            </button>
                            <button
                                type="button"
                                disabled={resending}
                                onClick={async () => {
                                    setResending(true);
                                    const err = await sendCode(details);
                                    setResending(false);
                                    if (err) toast.error(err);
                                    else toast.success('New code sent');
                                }}
                                className="min-h-9 font-medium text-primary-ink disabled:opacity-50"
                            >
                                {resending ? 'Sending…' : 'Send a new code'}
                            </button>
                        </div>
                    </form>
                </m.div>
            )}
        </AnimatePresence>
    );
}

/* ---------------- Forgot / reset password ---------------- */

export function ForgotForm() {
    const mode = useAppMode();
    const [sent, setSent] = useState<string | null>(null);
    const { register, handleSubmit, formState, setError } = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().trim().email('Enter a valid email') })) });
    if (mode === 'local') return <LocalModeNotice />;

    const onSubmit = handleSubmit(async ({ email }) => {
        const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error) setError('email', { message: error.message });
        else setSent(email);
    });

    if (sent) {
        return <Heading title="Check your email" sub={<>If <span className="font-medium text-foreground">{sent}</span> has an account, a reset link is on its way. <Link href="/login" className="font-medium text-primary-ink hover:underline">Back to sign in</Link></>} />;
    }
    return (
        <div>
            <Heading title="Reset your password" sub="We'll email you a link to choose a new one." />
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                    <Label htmlFor="fp-email">Email</Label>
                    <Input id="fp-email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!formState.errors.email} />
                    <FieldError>{formState.errors.email?.message}</FieldError>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
                    {formState.isSubmitting && <Loader2 className="animate-spin" />} Send reset link
                </Button>
                <Link href="/login" className="inline-flex min-h-9 items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-3.5" /> Back to sign in
                </Link>
            </form>
        </div>
    );
}

const resetSchema = z.object({ password: z.string().min(8, 'Use at least 8 characters').max(128), confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export function ResetForm() {
    const mode = useAppMode();
    const router = useRouter();
    const { register, handleSubmit, formState, setError } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
    if (mode === 'local') return <LocalModeNotice />;

    const onSubmit = handleSubmit(async ({ password }) => {
        const { error } = await supabaseBrowser().auth.updateUser({ password });
        if (error) {
            setError('password', { message: error.message.includes('session') ? 'This reset link has expired. Request a new one.' : error.message });
            return;
        }
        toast.success('Password updated');
        router.replace('/');
        router.refresh();
    });

    return (
        <div>
            <Heading title="Choose a new password" sub="At least 8 characters." />
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                    <Label htmlFor="np">New password</Label>
                    <Input id="np" type="password" autoComplete="new-password" {...register('password')} aria-invalid={!!formState.errors.password} />
                    <FieldError>{formState.errors.password?.message}</FieldError>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="npc">Confirm password</Label>
                    <Input id="npc" type="password" autoComplete="new-password" {...register('confirm')} aria-invalid={!!formState.errors.confirm} />
                    <FieldError>{formState.errors.confirm?.message}</FieldError>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
                    {formState.isSubmitting && <Loader2 className="animate-spin" />} Update password
                </Button>
            </form>
        </div>
    );
}
