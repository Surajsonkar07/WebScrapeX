# WebScrapeX

Turn any web page into clean rows. Paste a URL, choose an audit mode or write CSS selectors, and WebScrapeX runs the scrape on the server, saves it to your history, and exports CSV or JSON. It is polite by default: it obeys robots.txt and crawl-delay, rate-limits every account, and refuses private network addresses.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase, Cheerio and (optionally) headless Chrome.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in what you have — everything is optional for a local run
npm run dev                  # http://localhost:3000
```

```bash
npm run build && npm start   # production
npm run lint
npm run typecheck
```

**Without Supabase keys** the app runs in *local mode*: one user, no sign-in, history and files stored in `.data/` (git-ignored). Add the Supabase values to switch on accounts and cloud history. The **Setup** page (`/setup`) shows which variables are set — never their values.

### Supabase setup (once)

1. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It is idempotent and keeps existing v1 data.
2. Make sure the `scrapes` Storage bucket exists (the script creates it as private if missing).
3. Add `https://<your-domain>/auth/callback` to Authentication → URL configuration (Google sign-in and password reset).

## Environment variables

| Name | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Accounts, history, storage (omit both for local mode) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sign-up, API keys, schedules, admin stats, asset uploads |
| `NEXT_PUBLIC_SITE_URL` | Sitemap / Open Graph base URL |
| `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_SENDER_EMAIL` | Emailing the 6-digit sign-up code (in development the code is logged instead) |
| `GOOGLE_AI_API_KEY` (+ optional `GEMINI_MODEL`) | AI extraction page |
| `CRON_SECRET` | Protects `GET /api/cron/schedules` (scheduled runs) |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin` |
| `CHROME_EXECUTABLE_PATH` / `BROWSER_WS_ENDPOINT` / `CHROMIUM_PACK_URL` | Rendered (JavaScript) engine; local Chrome/Edge is auto-detected |
| `PROXY_URL` | Optional egress proxy for the browser engine |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` / `_PER_HOUR`, `SCRAPE_TIMEOUT_MS`, `SCRAPER_USER_AGENT` | Tuning (defaults 10 / 100 / 20000 ms / `WebScrapeXBot/2.0`) |

## Features

Full requirements, user stories and acceptance criteria: [docs/PRD.md](docs/PRD.md). Technical design and traceability: [docs/TRD.md](docs/TRD.md).

Status: **verified** = built and checked in a running production build (local mode, Nov 2026) · **done** = built, type-checked and lint-clean but not exercised end-to-end here · **blocked** = needs something only the owner can supply.

| ID | Feature | Status |
|---|---|---|
| F-01 | Scrape console (URL bar, 5 modes, 2 engines, progress strip, recent runs) | verified |
| F-02 | CSS selector fields, row selector, presets | verified (Hacker News preset: 30 rows) |
| F-03 | Live pre-flight: robots.txt verdict, crawl-delay, quota meters | verified |
| F-04 | Extraction: metadata, readable text, headings, data tables, links, images, SEO, social, colours, fonts, tech | verified (python.org full audit) |
| F-05 | Rendered engine (headless Chrome) with screenshot + PDF, static fallback | verified with local Chrome; serverless Chromium not tested |
| F-06 | Result page: readout strip, Data/Overview/SEO/Content/Links/Design/HTML/Log tabs | verified |
| F-07 | Export JSON and CSV per dataset (UTF-8 BOM, formula-safe) | verified |
| F-08 | Job history: search, status filter, pagination, delete, run again | verified |
| F-09 | robots.txt compliance (RFC 9309) — 403 `robots` | verified (google.com/search blocked) |
| F-10 | Rate limits per account (10/min, 100/h) + per-host politeness | verified (11th request → 429 + `Retry-After`) |
| F-11 | SSRF protection, redirect re-checks, sandboxed file serving | verified (127.0.0.1 → 400 `blocked_host`) |
| F-12 | Supabase auth: OTP sign-up, password login, Google, reset, sign-out, route guards | done — live sign-in not exercised (no test accounts were created on the real Supabase project) |
| F-13 | Local mode + setup states; production requires explicit opt-in | verified |
| F-14 | AI extraction (Gemini) with table + CSV | done; setup state verified — **blocked** for a live run until `GOOGLE_AI_API_KEY` is set |
| F-15 | API keys (hashed, revocable) + HTTP API + v1 endpoints | verified for create/list; Bearer-key auth applies in Supabase mode only (done) |
| F-16 | Schedules, webhooks, cron endpoint | verified (create, https-only webhook, Run now, cron 503 without secret); webhook delivery and cron need `CRON_SECRET` |
| F-17 | Save images to storage | verified (2/2 python.org images, sandbox CSP) |
| F-18 | Settings: theme, defaults, usage, account | verified |
| F-19 | Admin console gated by `ADMIN_EMAILS` | verified in local mode; Supabase stats need the service-role key |
| F-20 | Health check | verified |
| F-21 | Docs page | verified |
| F-22 | Ctrl/⌘+K command menu | verified |
| F-23 | Light / dark / system theme | verified |
| F-24 | Responsive layout, mobile tab bar, no horizontal scroll | verified at 375 px and 1024 px on every page |
| F-25 | PWA: manifest, icons, service worker, offline page | verified (manifest + `sw.js` served); install prompt not tested on a phone |
| F-26 | v1 data compatibility | done — needs the owner's existing Supabase data to verify |

Removed from v1: the in-memory queue worker scripts and `/api/test` (development leftovers, no user-facing feature), the stealth browser plugin (bot-detection evasion), and the hard-coded admin password.
## HTTP API

Send `Authorization: Bearer wsx_…` (create keys at `/api-access`) or a Supabase access token.

| Method | Path | |
|---|---|---|
| POST | `/api/v2/scrape` | `{ url, mode?, engine?, fields?, rowSelector? }` → `{ id, status, error?, summary }` |
| GET | `/api/v2/jobs` | list (`limit`, `offset`, `q`, `status`) |
| GET / DELETE | `/api/v2/jobs/{id}` | job + result + log / delete |
| GET | `/api/v2/jobs/{id}/export` | `format=json\|csv`, `dataset=fields\|links\|images\|headings\|meta\|table:N`, `full=1` |
| GET | `/api/v2/preflight?url=` | robots.txt verdict + quota |
| POST | `/api/v2/scrape/ai` | `{ url, prompt }` |
| POST | `/api/v2/scrape/assets` | `{ id, urls? }` copy images to storage |
| GET/POST | `/api/v2/keys`, DELETE `/api/v2/keys/{id}` | API keys (dashboard session only) |
| GET/POST | `/api/v2/schedules`, PATCH/DELETE `/api/v2/schedules/{id}`, POST `…/{id}/run` | schedules |
| GET | `/api/cron/schedules` | runs due schedules (`Bearer CRON_SECRET`) |
| GET | `/api/health` | health |

Errors are `{ error, code }`. Codes include `rate_limited` (429), `robots` (403), `blocked_host`, `timeout`, `http`, `not_html`, `migration_needed`.

## Project layout

```
app/(app)/        console, result/[id], collections (history), schedules, ai-scraper, api-access, docs, settings, admin, setup
app/(auth)/       login, signup, forgot-password, reset-password
app/api/          route handlers (above)
lib/scrape/       engine, safe-fetch (SSRF), robots, rate-limit, selectors, browser
lib/extractors/   metadata, content, SEO, social, LinkedIn, colours, fonts, tech
lib/store/        Supabase store + local file store behind one interface
components/       shell, console, result, jobs, ui primitives
supabase/schema.sql
```

Design system: see [DESIGN.md](DESIGN.md). Older project write-ups: `PROJECT_DOCUMENTATION.md`, `PRODUCTION.md`, `DEPLOYMENT.md`.
