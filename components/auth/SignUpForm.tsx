'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export function SignUpForm() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [step, setStep] = useState<'signup' | 'verify'>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();

    // Check session on mount / refresh safely
    useEffect(() => {
        const checkSession = async () => {
            // ALWAYS check getSession() BEFORE getUser() to suppress AuthSessionMissingError toast
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    router.push('/');
                    return;
                }
            }
            // Reset to clean signup form state on page refresh if unverified/missing session
            setStep('signup');
        };

        checkSession();
    }, [supabase, router]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Pre-signup OTP dispatch (NO early Supabase user creation)
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    fullName: name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification code.');
            }

            setSuccessMessage(data.message || 'Verification code sent!');
            setStep('verify');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Deferred user creation & email verification endpoint
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    code: otp,
                    password,
                    fullName: name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed. Check code and try again.');
            }

            // Auto sign-in user via client signInWithPassword
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.warn('Auto sign-in warning:', signInError.message);
            }

            // Redirect to home/dashboard on success
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Verification failed. Check code and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    fullName: name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend verification code.');
            }

            setSuccessMessage('A new verification code has been sent to your email.');
        } catch (err: any) {
            setError(err.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'verify') {
        return (
            <div className="space-y-8 py-8">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20"
                    >
                        <Mail className="w-10 h-10 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-black tracking-tight">Enter Verification Code</h2>
                    <p className="text-muted-foreground/80 font-medium">
                        We sent a 6-digit code to <span className="text-primary font-semibold">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerify} autoComplete="off" className="space-y-6">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{error}</span>
                            </motion.div>
                        )}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3"
                            >
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{successMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-2">
                        <div className="relative group">
                            <Input
                                type="text"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="h-16 text-center text-3xl tracking-[0.5em] font-mono bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 focus:border-primary/50 transition-all ring-offset-transparent"
                                required
                                autoFocus
                                maxLength={6}
                                autoComplete="off"
                            />
                            <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Check your inbox or spam folder for the 6-digit verification code.</p>
                    </div>

                    <AnimatedButton
                        type="submit"
                        className="w-full h-14 rounded-2xl shadow-lg shadow-primary/20 text-base font-black group transition-all"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <div className="flex items-center gap-2">
                                <span>Verify & Finish Registration</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </AnimatedButton>

                    <div className="flex items-center justify-between text-xs font-medium pt-2">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={loading}
                            className="text-primary hover:underline transition-all disabled:opacity-50"
                        >
                            Resend Code
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setStep('signup');
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            className="text-muted-foreground hover:text-white transition-colors"
                        >
                            Change Email Address
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <form onSubmit={handleSignUp} autoComplete="off" className="space-y-8">
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-sm flex items-center gap-4"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                <div className="relative group">
                    <motion.div animate={{ opacity: name ? 1 : 0.4 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all z-10">
                        <User className="w-5 h-5" />
                    </motion.div>
                    <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 focus:border-primary/50 transition-all text-sm ring-offset-transparent"
                        required
                        autoComplete="off"
                    />
                    <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>

                <div className="relative group">
                    <motion.div animate={{ opacity: email ? 1 : 0.4 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all z-10">
                        <Mail className="w-5 h-5" />
                    </motion.div>
                    <Input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 focus:border-primary/50 transition-all text-sm ring-offset-transparent"
                        required
                        autoComplete="off"
                    />
                    <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>

                <div className="relative group">
                    <motion.div animate={{ opacity: password ? 1 : 0.4 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all z-10">
                        <Lock className="w-5 h-5" />
                    </motion.div>
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create Secure Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 focus:border-primary/50 transition-all text-sm ring-offset-transparent"
                        required
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-white transition-colors z-20"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>
            </div>

            <AnimatedButton
                type="submit"
                className="w-full h-14 rounded-2xl shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.3)] text-base font-black group transition-all mt-4"
                disabled={loading}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <div className="flex items-center gap-2">
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                )}
            </AnimatedButton>
        </form>
    );
}
