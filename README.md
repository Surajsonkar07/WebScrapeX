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

v1 features are all kept (or replaced by a working version); v2 additions are marked **new**.

- [x] Scrape console: URL bar, five modes (Full audit, Content, Social, Design, Fields only) and two engines (static fetch, rendered Chrome with fallback)
- [x] **new** CSS selector fields with a row selector, attribute picker and presets (Hacker News, article, product cards, links, headings, images)
- [x] **new** Live pre-flight: robots.txt verdict, matching rule, crawl-delay and remaining quota while you type
- [x] Server-side extraction: metadata, readable text (Readability), headings, **new** HTML tables, links (internal/external/social), images, colours, fonts, tech stack, SEO audit, Open Graph/Twitter, LinkedIn public profile fields
- [x] Screenshot and PDF snapshot (rendered engine)
- [x] Result page: data preview table with filter, overview, SEO dial and findings, content outline, links, design (swatches, fonts, image grid), raw HTML, job log
- [x] Export JSON (with or without HTML) and **new** CSV per dataset (fields, each table, links, images, headings, metadata) — UTF-8 BOM, formula-injection safe
- [x] Save a job's images to storage (robots.txt checked per image, 5 MB cap)
- [x] Job history: search, status filter, pagination, delete, run again
- [x] Rate limiting per account (minute + hour windows, `Retry-After` headers) and **new** per-host politeness (≥1 s, crawl-delay honoured)
- [x] **new** robots.txt compliance (RFC 9309 longest-match, 15-minute cache) and SSRF protection (private IPs, redirects re-checked)
- [x] Auth via Supabase: email + password, 6-digit email code sign-up (Mailjet), Google OAuth, forgot password, **new** reset-password page
- [x] AI extraction with Gemini, now returns a table + CSV when the answer is a list (setup state when the key is missing)
- [x] API access: **new** real API keys (hashed, revocable) replacing the v1 mock key; curl / JavaScript / Python / n8n examples; v1 `/api/v2/scrape` and `/api/scrape/content` still work
- [x] Schedules: **new** working daily/weekly/monthly re-runs with webhooks and "Run now" (v1 modal only simulated this)
- [x] Settings: theme, scrape defaults, usage, account
- [x] Admin console: **new** gated by `ADMIN_EMAILS` and showing real stats (v1 used a hard-coded password)
- [x] Health check `GET /api/health`
- [x] Docs page, Ctrl+K command menu
- [x] **new** Local mode with clear setup states when Supabase is not configured
- [x] **new** PWA (installable, offline page), light/dark/system themes, mobile layout with bottom tab bar

Removed: the in-memory queue worker scripts and `/api/test` (development leftovers, no user-facing feature).

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
