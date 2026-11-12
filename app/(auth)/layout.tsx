import Link from 'next/link';

// Render per request so the sign-in screens reflect the server's current mode
// (Supabase / local / not set up) rather than whatever it was at build time.
export const dynamic = 'force-dynamic';
import { Logo } from '@/components/brand';
import { ThemeToggle } from '@/components/shell/theme-toggle';

const SAMPLE = [
    ['1', 'Show HN: A tiny SQLite clone in 900 lines', 'github.com'],
    ['2', 'The quiet death of the RSS reader', 'blog.example.org'],
    ['3', 'Ask HN: How do you back up your homelab?', 'news.ycombinator.com'],
    ['4', 'Notes on writing polite crawlers', 'example.dev'],
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className="flex flex-col px-5 py-6 sm:px-10">
                <header className="flex items-center justify-between">
                    <Link href="/" aria-label="WebScrapeX home">
                        <Logo />
                    </Link>
                    <ThemeToggle />
                </header>
                <main id="main" className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
                    {children}
                </main>
                <footer className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] text-muted-foreground">
                    <Link href="/docs" className="hover:text-foreground">docs</Link>
                    <Link href="/setup" className="hover:text-foreground">setup</Link>
                    <span>respects robots.txt</span>
                </footer>
            </div>

            {/* Product readout — what a run actually produces */}
            <aside aria-hidden className="relative hidden overflow-hidden border-l border-border bg-[oklch(0.19_0.012_255)] text-[oklch(0.93_0.008_85)] lg:flex lg:flex-col lg:justify-center lg:px-14">
                <div className="bench-grid absolute inset-0 opacity-60 [--grid-line:oklch(1_0_0/0.05)]" />
                <div className="relative max-w-lg space-y-8">
                    <div className="space-y-3">
                        <p className="font-mono text-[11px] tracking-[0.12em] text-[oklch(0.78_0.15_58)] uppercase">WebScrapeX · v2</p>
                        <p className="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.03em]">Selectors in. Clean rows out.</p>
                        <p className="text-[15px] text-[oklch(0.75_0.012_255)]">Server-side scraping with robots.txt checks, rate limits, job history and CSV/JSON export.</p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[oklch(1_0_0/0.1)] bg-[oklch(0.15_0.01_255)] shadow-2xl">
                        <div className="flex items-center gap-2 border-b border-[oklch(1_0_0/0.08)] px-4 py-2.5 font-mono text-[12px]">
                            <span className="rounded-sm bg-[oklch(0.3_0.06_55)] px-1.5 text-[oklch(0.82_0.13_62)]">GET</span>
                            <span className="text-[oklch(0.75_0.012_255)]">news.ycombinator.com</span>
                            <span className="ml-auto text-[oklch(0.8_0.14_162)]">200 · 31 rows · 0.8 s</span>
                        </div>
                        <table className="w-full table-fixed font-mono text-[12px]">
                            <thead>
                                <tr className="text-left text-[oklch(0.6_0.012_255)]">
                                    <th className="w-14 px-4 py-2 font-normal">rank</th>
                                    <th className="px-2 py-2 font-normal">title</th>
                                    <th className="w-40 px-4 py-2 font-normal">site</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SAMPLE.map(([r, t, s]) => (
                                    <tr key={r} className="border-t border-[oklch(1_0_0/0.06)]">
                                        <td className="px-4 py-2 text-[oklch(0.6_0.012_255)]">{r}</td>
                                        <td className="truncate px-2 py-2">{t}</td>
                                        <td className="truncate px-4 py-2 text-[oklch(0.75_0.012_255)]">{s}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <ul className="grid grid-cols-3 gap-4 font-mono text-[12px] text-[oklch(0.75_0.012_255)]">
                        <li><span className="block text-xl text-[oklch(0.93_0.008_85)]">RFC 9309</span>robots.txt</li>
                        <li><span className="block text-xl text-[oklch(0.93_0.008_85)]">10/min</span>rate limit</li>
                        <li><span className="block text-xl text-[oklch(0.93_0.008_85)]">CSV · JSON</span>exports</li>
                    </ul>
                </div>
            </aside>
        </div>
    );
}
