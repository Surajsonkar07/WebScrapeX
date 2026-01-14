'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrapeResult } from '@/lib/scraper-types';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

// New Card Components
import { MetadataCard } from '@/components/cards/MetadataCard';
import { ColorPaletteCard } from '@/components/cards/ColorPaletteCard';
import { FontsCard } from '@/components/cards/FontsCard';
import { ImageGalleryCard } from '@/components/cards/ImageGalleryCard';
import { AssetsCard } from '@/components/cards/AssetsCard';
import { LinksCard } from '@/components/cards/LinksCard';
import { TechCard } from '@/components/cards/TechCard';
import { RawHTMLCard } from '@/components/cards/RawHTMLCard';
import { InsightsCard } from '@/components/cards/InsightsCard';
import { FileCode, FileType } from 'lucide-react';
import { DynamicBackground } from '@/components/ui/DynamicBackground';
import { FloatingExportButton } from '@/components/FloatingExportButton';

export default function ResultPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [result, setResult] = useState<ScrapeResult | null>(null);
    const [status, setStatus] = useState<string>('pending');
    const [error, setError] = useState<string | null>(null);

    // Get dominant color for theme accents
    const primaryColor = result?.colors && result.colors.length > 0 ? result.colors[0] : null;

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchData = async () => {
            if (!id) return;

            try {
                // Poll for status first
                const { data: webData } = await (supabase.from('websites').select('status, url').eq('id', id).single() as any);
                if (webData) {
                    setStatus(webData.status);

                    if (webData.status === 'completed') {
                        // Fetch the full result.json via API
                        const res = await fetch(`/api/scrape/content?id=${id}`);

                        if (res.status === 401 || res.status === 403) {
                            router.push('/login');
                            return;
                        }

                        if (res.ok) {
                            let data = await res.json();

                            // Normalize legacy content.json if necessary
                            if (!data.metadata && data.links && typeof data.links === 'object') {
                                data = {
                                    url: webData.url || '',
                                    metadata: { title: '', description: '', keywords: [], favicon: '' },
                                    colors: [],
                                    fonts: [],
                                    images: data.images?.map((img: any) => ({ url: img.url, size: 0 })) || [],
                                    cssFiles: [],
                                    jsFiles: [],
                                    html: '',
                                    links: [...(data.links.internal || []), ...(data.links.external || [])],
                                    technologies: [],
                                    rawAssets: []
                                };
                            }

                            setResult(data);
                            clearInterval(interval);
                        }
                    } else if (webData.status === 'failed') {
                        setError('Scraping failed. Check logs for details.');
                        clearInterval(interval);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchData();
        interval = setInterval(fetchData, 3000);

        return () => clearInterval(interval);
    }, [id]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-stretch">
                <Sidebar />
                <div className="flex-1 md:ml-64 flex flex-col items-center justify-center bg-background/20 backdrop-blur-sm p-4 text-center">
                    <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
                        <ArrowLeft className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Error Occurred</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Link href="/">
                        <Button variant="outline">Back to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent font-sans relative flex items-stretch overflow-x-hidden">
            <DynamicBackground colors={result?.colors || []} />

            <Sidebar />

            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Header title={result?.metadata?.title} url={result?.url} favicon={result?.metadata?.favicon} />

                <main className="flex-1 max-w-[2000px] w-full mx-auto p-4 lg:p-6 xl:p-8">
                    <AnimatePresence mode="wait">
                        {!result ? (
                            <div key="loading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="rounded-2xl border bg-card/40 backdrop-blur-md p-8 space-y-4">
                                        <Skeleton className="h-4 w-1/3 rounded-full" />
                                        <Skeleton className="h-40 w-full rounded-xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-2/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                key="results"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 items-start"
                            >
                                <motion.div id="metadata" variants={itemVariants} className="lg:col-span-2 2xl:col-span-2">
                                    <MetadataCard metadata={result.metadata} />
                                </motion.div>
                                <motion.div id="insights" variants={itemVariants} className="2xl:col-span-2">
                                    <InsightsCard colors={result.colors} techs={result.technologies} metadata={result.metadata} />
                                </motion.div>
                                <motion.div variants={itemVariants}>
                                    <TechCard techs={result.technologies} />
                                </motion.div>
                                <motion.div id="colors" variants={itemVariants}>
                                    <ColorPaletteCard colors={result.colors} />
                                </motion.div>
                                <motion.div id="fonts" variants={itemVariants} className="md:col-span-2 lg:col-span-2">
                                    <FontsCard fonts={result.fonts} />
                                </motion.div>
                                <motion.div id="images" variants={itemVariants} className="lg:col-span-3 2xl:col-span-4">
                                    <ImageGalleryCard images={result.images} />
                                </motion.div>
                                <motion.div variants={itemVariants}>
                                    <AssetsCard title="CSS Files" icon={FileCode} iconColor="text-blue-500" files={result.cssFiles} />
                                </motion.div>
                                <motion.div variants={itemVariants}>
                                    <AssetsCard title="JS Files" icon={FileType} iconColor="text-yellow-500" files={result.jsFiles} />
                                </motion.div>
                                <motion.div id="links" variants={itemVariants} className="lg:col-span-3 2xl:col-span-4">
                                    <LinksCard links={result.links} />
                                </motion.div>
                                <motion.div id="html" variants={itemVariants} className="lg:col-span-3 2xl:col-span-4">
                                    <RawHTMLCard html={result.html} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
            <FloatingExportButton />
        </div>
    );
}
