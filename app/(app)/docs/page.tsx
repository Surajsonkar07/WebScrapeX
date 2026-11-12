import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/misc';
import { Reveal } from '@/components/motion/reveal';

export const metadata: Metadata = {
    title: 'Docs',
    description: 'How WebScrapeX works: modes, engines, CSS selector fields, exports, robots.txt and rate limits, schedules and the HTTP API.',
};

const SECTIONS = [
    { id: 'first-run', title: 'Your first run' },
    { id: 'modes', title: 'Modes and engines' },
    { id: 'selectors', title: 'Writing selector fields' },
    { id: 'export', title: 'Exports' },
    { id: 'politeness', title: 'robots.txt and rate limits' },
    { id: 'schedules', title: 'Schedules and webhooks' },
    { id: 'api', title: 'HTTP API' },
];

export default function DocsPage() {
    return (
        <div className="space-y-8">
            <PageHeader eyebrow="Docs" title="How WebScrapeX works" description="Everything the console does, in the order you will need it." />
            <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
                <nav aria-label="On this page" className="lg:sticky lg:top-10 lg:self-start">
                    <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
                        {SECTIONS.map((s, i) => (
                            <li key={s.id} className="shrink-0">
                                <a href={`#${s.id}`} className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                                    <span className="font-mono text-[11px]">{String(i + 1).padStart(2, '0')}</span> {s.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <article className="max-w-3xl space-y-12 text-[15px] leading-7 [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-semibold [&_p+p]:mt-3">
                    <Reveal as="section">
                        <h2 id="first-run">Your first run</h2>
                        <ol className="list-decimal space-y-2 pl-5">
                            <li>
                                Open the <Link href="/" className="text-primary-ink underline-offset-4 hover:underline">Console</Link> and paste a URL. The pre-flight panel reads the site&apos;s robots.txt while you type.
                            </li>
                            <li>Pick a mode. <strong>Full audit</strong> collects everything; <strong>Fields only</strong> runs just your selectors.</li>
                            <li>Optional: open <strong>Fields</strong>, choose a preset or add your own CSS selectors.</li>
                            <li>Press <strong>Run scrape</strong>. When it finishes you land on the result, with a data preview and an Export menu.</li>
                        </ol>
                    </Reveal>

                    <Reveal as="section">
                        <h2 id="modes">Modes and engines</h2>
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th scope="col" className="label-mono px-3 py-2">Mode</th>
                                        <th scope="col" className="label-mono px-3 py-2">Collects</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top">
                                    <tr><td className="font-medium">Full audit</td><td>Metadata, readable text, headings, HTML tables, links, images, SEO checks, Open Graph/Twitter tags, colours, fonts, tech stack</td></tr>
                                    <tr><td className="font-medium">Content</td><td>Readable text (Mozilla Readability), headings, tables, links, SEO checks</td></tr>
                                    <tr><td className="font-medium">Social</td><td>Open Graph and Twitter card tags, JSON-LD person data, outbound social links, public LinkedIn profile fields</td></tr>
                                    <tr><td className="font-medium">Design</td><td>Colour palette, font families, images, technologies; screenshot with the rendered engine</td></tr>
                                    <tr><td className="font-medium">Fields only</td><td>Just your selector columns — fastest</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4">
                            The <strong>static</strong> engine fetches the HTML and parses it on the server — quick and light. The <strong>rendered</strong> engine loads the page in headless Chrome first, so content drawn by JavaScript is
                            included, and captures a screenshot and PDF. It needs Chrome on the server (auto-detected locally, or set <code>CHROME_EXECUTABLE_PATH</code> / <code>BROWSER_WS_ENDPOINT</code>); without one the run falls back to static and tells you.
                        </p>
                    </Reveal>

                    <Reveal as="section">
                        <h2 id="selectors">Writing selector fields</h2>
                        <p>Each field is one column: a name, a CSS selector and what to read — the element&apos;s <code>text</code>, <code>href</code>, <code>src</code>, inner <code>html</code>, or any attribute.</p>
                        <p>
                            Add a <strong>row selector</strong> when the page repeats a pattern (product cards, table rows, search results). Every match becomes a row, and each field is looked up inside it. Leave a field&apos;s selector empty to read
                            the row element itself. Links and image paths come back as absolute URLs.
                        </p>
                        <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-inset p-4 text-[12.5px] leading-6">
                            <code className="!bg-transparent !p-0">{`row selector   tr.athing
title          .titleline > a     text
link           .titleline > a     href
rank           .rank              text`}</code>
                        </pre>
                        <p className="mt-4">Without a row selector, each field takes its first match (through the API, set <code>&quot;multiple&quot;: true</code> on a field to collect every match). Invalid selectors are reported as warnings on the result instead of failing the whole run.</p>
                    </Reveal>

                    <Reveal as="section">
                        <h2 id="export">Exports</h2>
                        <p>
                            <strong>JSON</strong> gives the whole result (add the raw HTML with the &ldquo;full&rdquo; option). <strong>CSV</strong> is available per dataset: your selector fields, each detected HTML table, links, images, headings and a
                            key/value sheet of page metadata. CSV files are UTF-8 with a BOM so Excel opens them correctly, and cells that start with <code>=</code>, <code>+</code>, <code>-</code> or <code>@</code> are escaped to stop formula injection.
                        </p>
                    </Reveal>

                    <Reveal as="section">
                        <h2 id="politeness">robots.txt and rate limits</h2>
                        <p>
                            Every request identifies as <code>WebScrapeXBot/2.0</code>. Before fetching, WebScrapeX reads the site&apos;s <code>/robots.txt</code> (cached for 15 minutes) and follows RFC 9309: the most specific matching rule wins, a
                            missing file allows everything, and a server error is treated as &ldquo;disallow all&rdquo;. <code>Crawl-delay</code> is honoured, and there is always at least one second between requests to the same host.
                        </p>
                        <p>
                            Your account can run <strong>10 scrapes a minute and 100 an hour</strong> by default (the operator can change this). AI extraction allows 5 a minute. Private and local network addresses are refused, and every redirect
                            is re-checked.
                        </p>
                    </Reveal>

                    <Reveal as="section">
                        <h2 id="schedules">Schedules and webhooks</h2>
                        <p>
                            From any result, choose <strong>Schedule</strong> to re-run it daily, weekly or monthly with the same options. If you give a webhook URL, a JSON summary is POSTed after each run. Scheduled runs are triggered by a cron
                            calling <code>/api/cron/schedules</code>; see <Link href="/setup" className="text-primary-ink underline-offset-4 hover:underline">Setup</Link>.
                        </p>
                    </Reveal>

                    <Reveal as="section">
                        <h2 id="api">HTTP API</h2>
                        <p>
                            Create a key on <Link href="/api-access" className="text-primary-ink underline-offset-4 hover:underline">API keys</Link> and send it as <code>Authorization: Bearer wsx_…</code>. The same page has copy-ready
                            examples for curl, JavaScript, Python and n8n. A Supabase session token works too, so existing v1 integrations keep running.
                        </p>
                    </Reveal>
                </article>
            </div>
        </div>
    );
}
