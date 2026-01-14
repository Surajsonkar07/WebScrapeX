'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Zap, Code2, Palette, FileImage, LayoutGrid, Clock, ArrowRight } from 'lucide-react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { DynamicBackground } from '@/components/ui/DynamicBackground';
import { HistoryCard } from '@/components/HistoryCard';
import { ScrollFadeIn, TextReveal, MotionDiv, ParallaxWrapper, ImageReveal } from '@/components/ui/MotionWrappers';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useAuth } from '@/hooks/useAuth';
import { IconGlow } from '@/components/ui/PremiumAnimations';

export function HomeContent() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { user, session } = useAuth();
    const searchParams = useSearchParams();
    const [url, setUrl] = useState(searchParams.get('scrape') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) {
                setHistory([]);
                return;
            }

            const { data, error } = await supabase
                .from('websites')
                .select(`
          id,
          url,
          created_at,
          metadata (
            title,
            favicon,
            color_palette
          )
        `)
                .eq('status', 'completed')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(9);

            if (!error && data) {
                setHistory(data.map((item: any) => ({
                    ...item,
                    metadata: Array.isArray(item.metadata) ? item.metadata[0] : item.metadata
                })));
            }
        };

        fetchHistory();
    }, [user]);

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        if (!user) {
            const returnUrl = encodeURIComponent(`/?scrape=${encodeURIComponent(url)}`);
            router.push(`/login?returnTo=${returnUrl}`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Sending capture request to API v2...');
            const res = await fetch('/api/v2/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ url }),
                credentials: 'include', // Force sending cookies
            });

            if (res.status === 401) {
                router.push('/login');
                return;
            }

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response (${res.status}). It might be a redirect or error page.`);
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.details || data.error || 'Failed to start scraping');
            }

            router.push(`/result/${data.id}`);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen relative overflow-x-hidden flex flex-col items-center pt-20 pb-12 px-4 scroll-smooth">
            <DynamicBackground colors={[]} />

            {/* Hero Section */}
            <section className="w-full max-w-7xl z-10 flex flex-col items-center mb-20 md:mb-24">
                <ScrollFadeIn direction="up">
                    <div className="text-center mb-10 md:mb-12 flex flex-col items-center w-full max-w-5xl relative">
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />

                        <MotionDiv
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 md:mb-8 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80"
                        >
                            <Zap className="w-3 h-3 fill-current" />
                            Intelligence Driven Extraction
                        </MotionDiv>

                        <h1 className="text-4xl md:text-6xl lg:text-[7rem] font-black tracking-tighter mb-6 md:mb-8 leading-[0.9] md:leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/40 py-2">
                            <TextReveal text="Design" />
                            <TextReveal text="Intelligence." />
                        </h1>

                        <ScrollFadeIn delay={0.2}>
                            <p className="text-base md:text-xl text-muted-foreground/60 max-w-xl md:max-w-2xl mx-auto leading-relaxed font-medium">
                                Deconstruct any website's design system in seconds. <br className="hidden md:block" />
                                Colors, fonts, assets, and code — extracted and analyzed.
                            </p>
                        </ScrollFadeIn>
                    </div>
                </ScrollFadeIn>

                <ScrollFadeIn delay={0.4} className="w-full max-w-3xl mb-20 md:mb-24">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative backdrop-blur-3xl bg-background/60 border border-white/10 p-2 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl">
                            <form onSubmit={handleScrape} className="relative flex items-center">
                                <div className="absolute left-4 md:left-8 text-muted-foreground/40">
                                    <Search className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <Input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="pl-12 md:pl-20 pr-16 md:pr-48 h-14 md:h-20 text-sm md:text-xl font-medium rounded-[1.5rem] md:rounded-[2rem] bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/30 selection:bg-primary/20 text-left"
                                    required
                                />
                                <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                                    <AnimatedButton
                                        type="submit"
                                        variant="sweep"
                                        className="h-10 md:h-16 px-3 md:px-10 text-xs md:text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] rounded-[1.2rem] md:rounded-[1.5rem]"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        ) : (
                                            <div className="flex items-center gap-0 md:gap-2">
                                                <span className="hidden md:inline">Capture</span>
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                    </AnimatedButton>
                                </div>
                            </form>
                        </div>
                        {error && <p className="absolute -bottom-10 left-8 text-destructive text-sm font-medium">{error}</p>}
                    </div>
                </ScrollFadeIn>
            </section>

            {/* Feature Section */}
            <section id="features" className="w-full max-w-7xl z-10 px-4 mb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ScrollFadeIn delay={0.1}>
                        <AnimatedCard variant="glass">
                            <div className="mb-6">
                                <IconGlow icon={<Code2 className="w-8 h-8 text-primary" />} color="primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 tracking-tight">Full Stack Analysis</h3>
                            <p className="text-muted-foreground leading-relaxed">Deep detection of frameworks, libraries, and sub-systems with version mapping.</p>
                        </AnimatedCard>
                    </ScrollFadeIn>

                    <ScrollFadeIn delay={0.2}>
                        <AnimatedCard variant="glass">
                            <div className="mb-6">
                                <IconGlow icon={<Palette className="w-8 h-8 text-purple-500" />} color="purple" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 tracking-tight">Design DNA</h3>
                            <p className="text-muted-foreground leading-relaxed">Automatic generation of brand guidelines including color accessibility and type scales.</p>
                        </AnimatedCard>
                    </ScrollFadeIn>

                    <ScrollFadeIn delay={0.3}>
                        <AnimatedCard variant="glass">
                            <div className="mb-6">
                                <IconGlow icon={<FileImage className="w-8 h-8 text-emerald-500" />} color="emerald" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 tracking-tight">Asset Vault</h3>
                            <p className="text-muted-foreground leading-relaxed">Centralized repository for all high-res images, icons, and vector assets extracted locally.</p>
                        </AnimatedCard>
                    </ScrollFadeIn>
                </div>
            </section>

            {/* Parallax Image Section (Visual Polish) */}
            <section className="w-full max-w-6xl mb-20 md:mb-32 relative overflow-hidden rounded-[2rem] md:rounded-[4rem] group">
                <ParallaxWrapper offset={80}>
                    <div className="h-[400px] md:h-[600px] w-full bg-gradient-to-br from-primary/20 via-background to-purple-500/20 relative">
                        <div className="absolute inset-0 flex items-center justify-center p-8 md:p-20">
                            <div className="text-center">
                                <h2 className="text-4xl md:text-6xl font-black mb-4 md:mb-6">Built for speed.</h2>
                                <p className="text-base md:text-xl text-muted-foreground max-w-lg mx-auto">Experience the fastest design extraction engine ever built. No more manual devtools inspection.</p>
                            </div>
                        </div>
                        {/* Mesh gradient decor */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[150px] -z-10" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/20 blur-[150px] -z-10" />
                    </div>
                </ParallaxWrapper>
            </section>

            {/* History Collection Section */}
            {history.length > 0 && (
                <section className="w-full max-w-7xl z-10 px-4 space-y-12 mb-32">
                    <ScrollFadeIn direction="up">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-12">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                                    Personal Library
                                </div>
                                <h2 className="text-6xl font-black tracking-tighter">Your Collections</h2>
                                <p className="text-xl text-muted-foreground/60 max-w-xl">
                                    A high-fidelity archive of all design systems you've previously analyzed.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4" />
                                    <span>{history.length} ITEMS</span>
                                </div>
                                <div className="w-px h-4 bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>SYNCED</span>
                                </div>
                            </div>
                        </div>
                    </ScrollFadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                        {history.map((item, idx) => (
                            <ScrollFadeIn key={item.id} delay={idx * 0.05}>
                                <HistoryCard item={item} />
                            </ScrollFadeIn>
                        ))}
                    </div>
                </section>
            )}
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'WebScrapeX',
                        applicationCategory: 'DeveloperApplication',
                        operatingSystem: 'Any',
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'USD',
                        },
                        description: 'Extract assets, metadata, colors, technologies, and design systems from any website.',
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: '4.8',
                            ratingCount: '1024',
                        },
                    }),
                }}
            />
        </main>
    );
}
