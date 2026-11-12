'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/overlay';

const ENDPOINTS: Array<[string, string, string]> = [
    ['POST', '/api/v2/scrape', 'Run a scrape. Body: url, mode, engine, fields[], rowSelector. Returns the job id.'],
    ['GET', '/api/v2/jobs', 'List your jobs. Query: limit, offset, q, status.'],
    ['GET', '/api/v2/jobs/{id}', 'Job, full result and log lines.'],
    ['GET', '/api/v2/jobs/{id}/export', 'Download. format=json|csv, dataset=fields|links|images|headings|meta|table:N'],
    ['DELETE', '/api/v2/jobs/{id}', 'Delete a job and its stored files.'],
    ['GET', '/api/v2/preflight?url=', 'robots.txt verdict and your remaining quota.'],
    ['POST', '/api/v2/scrape/ai', 'AI extraction. Body: url, prompt.'],
    ['POST', '/api/v2/schedules', 'Create a schedule. Scrape body plus frequency and webhookUrl.'],
];

export function CodeSamples({ origin }: { origin: string }) {
    const body = `{
  "url": "https://news.ycombinator.com/",
  "mode": "custom",
  "rowSelector": "tr.athing",
  "fields": [
    { "name": "title", "selector": ".titleline > a", "attribute": "text" },
    { "name": "link",  "selector": ".titleline > a", "attribute": "href" }
  ]
}`;
    const samples = {
        curl: `curl -X POST ${origin}/api/v2/scrape \\
  -H "Authorization: Bearer $WSX_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${body.replace(/\n\s*/g, ' ')}'

# then download the rows
curl -H "Authorization: Bearer $WSX_KEY" \\
  "${origin}/api/v2/jobs/<id>/export?format=csv&dataset=fields" -o rows.csv`,
        javascript: `const res = await fetch('${origin}/api/v2/scrape', {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.WSX_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${body.replace(/\n/g, '\n  ')}),
});
const { id, status, error } = await res.json();
if (status !== 'completed') throw new Error(error);

const job = await fetch(\`${origin}/api/v2/jobs/\${id}\`, {
  headers: { Authorization: \`Bearer \${process.env.WSX_KEY}\` },
}).then((r) => r.json());
console.log(job.result.fields.rows);`,
        python: `import os, requests

r = requests.post(
    "${origin}/api/v2/scrape",
    headers={"Authorization": f"Bearer {os.environ['WSX_KEY']}"},
    json=${body.replace(/\n/g, '\n    ').replace(/true/g, 'True')},
    timeout=90,
)
r.raise_for_status()
job_id = r.json()["id"]
csv = requests.get(
    f"${origin}/api/v2/jobs/{job_id}/export",
    params={"format": "csv", "dataset": "fields"},
    headers={"Authorization": f"Bearer {os.environ['WSX_KEY']}"},
).text`,
        n8n: `HTTP Request node
  Method:          POST
  URL:             ${origin}/api/v2/scrape
  Authentication:  Generic → Header Auth
    Name:          Authorization
    Value:         Bearer wsx_…
  Body (JSON):     ${body.replace(/\n\s*/g, ' ')}
  Timeout:         90000 ms`,
    };
    const [tab, setTab] = useState<keyof typeof samples>('curl');

    return (
        <section aria-labelledby="usage-h" className="space-y-4">
            <h2 id="usage-h" className="text-xl font-semibold">
                Usage
            </h2>
            <Tabs value={tab} onValueChange={(v) => setTab(v as keyof typeof samples)}>
                <TabsList aria-label="Language">
                    {Object.keys(samples).map((k) => (
                        <TabsTrigger key={k} value={k} className="font-mono text-[13px]">
                            {k}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {Object.entries(samples).map(([k, code]) => (
                    <TabsContent key={k} value={k} className="relative pt-4">
                        <button
                            type="button"
                            onClick={async () => {
                                await navigator.clipboard.writeText(code);
                                toast.success('Copied');
                            }}
                            className="absolute top-6 right-2 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Copy code"
                        >
                            <Copy className="size-4" />
                        </button>
                        <pre className="scroll-slim overflow-x-auto rounded-lg border border-border bg-inset p-4 pr-12 text-[12.5px] leading-6">
                            <code>{code}</code>
                        </pre>
                    </TabsContent>
                ))}
            </Tabs>

            <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                    <caption className="sr-only">Endpoints</caption>
                    <thead className="bg-muted/60">
                        <tr>
                            <th scope="col" className="label-mono px-4 py-2">Endpoint</th>
                            <th scope="col" className="label-mono hidden px-4 py-2 md:table-cell">What it does</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ENDPOINTS.map(([method, path, desc]) => (
                            <tr key={method + path} className="border-t border-border align-top">
                                <td className="px-4 py-3">
                                    <span className="mr-2 inline-block w-14 font-mono text-[11px] font-medium text-primary-ink">{method}</span>
                                    <span className="font-mono text-[13px] break-all">{path}</span>
                                    <p className="mt-1 text-[13px] text-muted-foreground md:hidden">{desc}</p>
                                </td>
                                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[13px] text-muted-foreground">
                Errors come back as <span className="font-mono">{'{ error, code }'}</span>. A 429 includes <span className="font-mono">Retry-After</span> and <span className="font-mono">X-RateLimit-*</span> headers. A 403 with code <span className="font-mono">robots</span> means the site&apos;s robots.txt disallows the path.
            </p>
        </section>
    );
}
