'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (returnTo) {
                router.push(decodeURIComponent(returnTo));
            } else {
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                <div className="relative group">
                    <motion.div
                        initial={false}
                        animate={{ opacity: email ? 1 : 0.4 }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-300 z-10"
                    >
                        <Mail className="w-5 h-5" />
                    </motion.div>
                    <Input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 focus:border-primary/50 transition-all text-sm ring-offset-transparent focus-visible:ring-primary/20"
                        required
                    />
                    <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>

                <div className="relative group">
                    <motion.div
                        initial={false}
                        animate={{ opacity: password ? 1 : 0.4 }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-300 z-10"
                    >
                        <Lock className="w-5 h-5" />
                    </motion.div>
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:bg-white/10 focus:border-primary/50 transition-all text-sm ring-offset-transparent focus-visible:ring-primary/20"
                        required
                    />
                    <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
                </div>
            </div>

            <div className="flex justify-end mt-2">
                <Link href="/forgot-password" title="Forgot Password?" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors">
                    Forgot Password?
                </Link>
            </div>

            <AnimatedButton
                type="submit"
                className="w-full h-14 rounded-2xl shadow-lg shadow-primary/20 text-base font-black group transition-all mt-4"
                disabled={loading}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <div className="flex items-center gap-2">
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                )}
            </AnimatedButton>
        </form>
    );
}
