# WebScrapeX — Product Requirements Document

Version 2.0 · November 2026 · Owner: WebScrapeX maintainer
Status legend used in the README and release report: **done** (built), **verified** (built and checked in a running app), **blocked** (needs something only the owner can supply).

---

## 1. Overview

**What it is.** WebScrapeX is a web app and HTTP API that turns a public web page into structured data. A user pastes a URL, chooses what to collect (an audit mode and/or their own CSS selectors), and the server fetches the page, extracts the data, stores the run in their history, and lets them preview it and download CSV or JSON.

**The problem.** People who need data from web pages either copy-paste by hand, write a one-off script per site, or use heavy scraping platforms that ignore site owners' wishes and cost money. They want something in between: point at a page, describe the columns, get a spreadsheet — and not get their IP banned or upset the site owner.

**Who it is for.**

| Persona | Context | What they need |
|---|---|---|
| **Riya, growth analyst at a Bengaluru D2C brand** | Tracks competitors' product pages and prices weekly; lives in Google Sheets. Not a developer, but can copy a CSS selector from DevTools. | Selector presets, a data preview she can trust, CSV that opens cleanly in Excel/Sheets, weekly schedules. |
| **Arjun, freelance web developer** | Audits client sites before redesigns: SEO tags, fonts, colours, tech stack, broken metadata. | One-click "full audit", design tokens (colours/fonts), screenshot, JSON export for his report. |
| **Meera, automation engineer at an MSME** | Builds n8n/Zapier-style workflows that need fresh data from a supplier's catalogue page. | An API key, a stable JSON contract, webhooks when a scheduled run finishes, clear error codes. |
| **Operator (the owner)** | Runs the service on Vercel + Supabase for a small team. | Setup checklist, admin stats, health endpoint, rate limits, no surprise bills or abuse. |

## 2. Goals, metrics, non-goals

**Goals**
1. First successful scrape within 60 seconds of opening the app (paste URL → run → see rows).
2. Every run is polite: robots.txt checked, rate-limited, identifiable user-agent.
3. Every result can leave the app as CSV or JSON without manual cleanup.
4. Works on a phone as well as a laptop; installable as a PWA.

**Success metrics**
- ≥ 90% of static-engine runs on reachable, robots-allowed pages complete in < 5 s (server time, `fetch.durationMs`).
- 0 requests sent to paths disallowed by robots.txt (enforced in code; covered by the robots tests in TRD §10).
- Lighthouse (mobile, production build): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 on public pages.
- CSV exports open in Excel with correct UTF-8 characters and no formula execution.

**Non-goals (this release)**
- Crawling whole sites / following links automatically (one URL per run).
- Bypassing logins, paywalls, CAPTCHAs or bot protection. Stealth browser plugins were removed on purpose.
- Proxy rotation to evade blocks. A single optional egress proxy is supported for networking reasons only.
- Billing and paid plans (v1 had a placeholder tab with no backend).
- Team workspaces / shared history.

## 3. Scope

**In scope:** everything in the feature list below, including all v1 features (hybrid fast/deep scraping, extractors, AI extraction, asset download, history, auth with OTP sign-up, API access page, docs, settings, admin, health check, PWA, dark mode).

**Out of scope:** multi-page crawling, scheduled runs more often than daily on Vercel Hobby (cron limit), billing, mobile native apps, browser extension.

## 4. Features

Each feature lists user stories and acceptance criteria (AC). AC are written to be checked against a running app.

### F-01 Scrape console
*As Riya, I want one screen where I paste a URL and run a scrape, so that getting data takes seconds.*
- AC1 The console (`/`) has a URL field that accepts `example.com/path` or a full `http(s)://` URL; invalid URLs show an inline error.
- AC2 Five modes are selectable: Full audit, Content, Social, Design, Fields only; each shows a one-line description.
- AC3 Engine toggle: Static (fetch) or Rendered (headless Chrome).
- AC4 While running, a progress strip shows stages (robots.txt → fetch → parse → extract → save) and elapsed seconds; the Run button is disabled.
- AC5 On success the user lands on the result page and sees a toast; on failure an inline error explains why and links to the job log.
- AC6 Signed-out visitors (Supabase mode) see "Sign in to run" and are sent to `/login?next=…` with the URL preserved.
- AC7 `/?url=…` pre-fills the URL field (used by "Run again" and the command menu).
- AC8 The last 6 runs are listed under the console with a link to full history; an empty state appears when there are none.

### F-02 CSS selector fields
*As Riya, I want to name columns and give a CSS selector for each, so that I get exactly the table I need.*
- AC1 Fields panel: add/remove up to 25 fields; each has column name, CSS selector and what to read (text, href, src, html, or a named attribute).
- AC2 Optional row selector: each match becomes one row and fields resolve inside it; an empty field selector reads the row element itself.
- AC3 Without a row selector each field takes its first match; via the API `multiple: true` collects every match.
- AC4 Presets fill the editor: Hacker News front page, Article, Product cards, Every link, Heading outline, Images with alt text.
- AC5 `href`/`src` values are returned as absolute URLs.
- AC6 An invalid CSS selector does not fail the run; it is reported in the result's warnings.
- AC7 "Fields only" mode requires at least one valid field and keeps the editor open.

### F-03 Pre-flight check
*As any user, I want to see whether a site allows scraping before I run, so that I don't waste a run or upset the owner.*
- AC1 While typing a URL (debounced ~0.5 s) a side panel shows: allowed/blocked by robots.txt, the matching rule, crawl-delay if any.
- AC2 It shows remaining scrape quota for this minute and hour as meters.
- AC3 Private/local addresses show an error instead of a verdict.
- AC4 Quota refreshes after each run.

### F-04 Extraction
*As Arjun, I want an audit of the page, so that I can report on SEO, content and design.*
- AC1 Full audit returns: metadata (title, description, keywords, favicon, lang, canonical), readable text with word count and reading time, heading outline, HTML tables, links (internal/external/social), images with alt, SEO score and findings, Open Graph/Twitter tags, colours, font families, technologies.
- AC2 Content, Social, Design and Fields-only modes return only their subsets (see Docs page table).
- AC3 Public LinkedIn profile URLs (`linkedin.com/in/…`) additionally return name, headline, location and experience when present in the HTML.
- AC4 Pages over 3 MB are truncated with a warning; non-HTML responses fail with a clear message.

### F-05 Rendered engine, screenshot and PDF
*As Arjun, I want JavaScript-heavy pages rendered and a screenshot captured, so that the audit matches what visitors see.*
- AC1 Rendered engine uses headless Chrome: auto-detected local Chrome/Edge, `CHROME_EXECUTABLE_PATH`, a remote `BROWSER_WS_ENDPOINT`, or `@sparticuz/chromium` on serverless with `CHROMIUM_PACK_URL`.
- AC2 Full and Design modes capture a JPEG screenshot (shown on the Design tab) and an A4 PDF (Export menu).
- AC3 If no browser is available the run falls back to Static and says so in the warnings.

### F-06 Result page
*As any user, I want a clear view of one run, so that I can check the data before exporting.*
- AC1 Header: favicon, page title, final URL (opens in a new tab), and a readout strip with status, HTTP code, size, duration, mode·engine, capture time.
- AC2 Tabs appear only when they have data: Data, Overview, SEO, Content, Links, Design, HTML, Log.
- AC3 Data tab: switch between selector fields and each detected HTML table; filterable preview table that scrolls inside its frame; "show more" paging; Copy JSON; CSV for the active dataset.
- AC4 Failed runs show the error and the Log tab.
- AC5 A job still running (opened from elsewhere) auto-refreshes until it finishes.
- AC6 Actions: Export, Run again, Schedule, Delete (with confirmation).

### F-07 Export
*As Riya, I want CSV and JSON downloads, so that the data goes straight into Sheets or my code.*
- AC1 JSON export without HTML/screenshot by default; "full" variant includes raw HTML.
- AC2 CSV export per dataset: fields, each table, links, images, headings, page metadata.
- AC3 CSV is UTF-8 with BOM, CRLF line endings, RFC 4180 quoting, and cells starting with `= + - @` are prefixed with `'` (formula-injection safe).
- AC4 File names are `<host>-<dataset>.csv` / `<host>-result.json`.

### F-08 Job history
*As Riya, I want all my past runs kept, so that I can re-download or repeat them.*
- AC1 `/collections` lists runs newest first with status dot, title (or host), URL or error, mode, row count and relative time.
- AC2 Search by URL (debounced), filter All / Done / Failed, 20 per page with newer/older links.
- AC3 Row menu: Open, Scrape again, Download JSON, Delete (optimistic removal + toast).
- AC4 Runs created by WebScrapeX v1 still open (F-26).

### F-09 robots.txt compliance
*As the operator, I want every fetch to respect robots.txt, so that the service is a good citizen.*
- AC1 Before each page fetch, `/robots.txt` of the origin is read (cached 15 minutes) and evaluated for user-agent `WebScrapeXBot` (falling back to `*`).
- AC2 RFC 9309 rules: longest matching rule wins, `Allow` wins ties, `*` and `$` wildcards supported; 4xx = allow all; 5xx/unreachable = disallow all.
- AC3 A disallowed path fails the run with HTTP 403, code `robots`, and the rule that blocked it.
- AC4 The same check applies to AI extraction and to each image in "Save to storage".
- AC5 Requests send the user-agent `WebScrapeXBot/2.0 (+…; respects robots.txt)` (overridable by the operator).

### F-10 Rate limiting and politeness
*As the operator, I want limits per account and per target site, so that no one can abuse the service or hammer a site.*
- AC1 Per account: 10 scrapes/minute and 100/hour by default (`RATE_LIMIT_REQUESTS_PER_MINUTE/HOUR`).
- AC2 Exceeding returns 429 with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`; the console shows the message and a toast.
- AC3 Separate limits: AI extraction 5/min and 40/hour; asset saving 5/min; pre-flight 40/min; sign-up code 3 per 10 min per email+IP; code verification 8 per 15 min.
- AC4 Per target host: at least 1 s between requests, or the robots.txt crawl-delay (max 10 s).

### F-11 Network safety
*As the operator, I want the server never to be used to reach private networks, so that the deployment is not an SSRF hole.*
- AC1 Only http/https; URLs with credentials rejected.
- AC2 Hostnames resolving to loopback, private, link-local, CGNAT, multicast or metadata ranges are refused (`blocked_host`); `localhost`, `*.local`, `*.internal` refused.
- AC3 Every redirect hop is re-checked; max 5 redirects; 20 s timeout; 3 MB body cap.
- AC4 Webhook URLs must be https and public.
- AC5 Stored files are served with a sandboxing CSP and `nosniff`.

### F-12 Accounts and authentication
*As a new user, I want to sign up with a verified email or Google, so that my history is private to me.*
- AC1 Sign-up: name, email, password (≥ 8) → 6-digit code emailed (Mailjet) → code + details create a confirmed Supabase user → auto sign-in. No user exists until the code is verified.
- AC2 Already-registered emails get "Sign in instead"; wrong/expired codes get clear messages; "Send a new code" and "Change email" work.
- AC3 Login with email/password; wrong credentials show an inline error; `?next=` is honoured (same-origin paths only).
- AC4 Continue with Google (Supabase OAuth) via `/auth/callback`.
- AC5 Forgot password emails a link that lands on `/reset-password`; old v1 links to `/auth/update-password` are forwarded.
- AC6 Sign out from the sidebar, mobile menu and Settings.
- AC7 Signed-out visitors are redirected from app pages to `/login`; API routes return 401 JSON.
- AC8 Users only ever see their own jobs, files, keys and schedules (server filters by user id; RLS policies in `supabase/schema.sql`).

### F-13 Local mode and setup states
*As a developer or the operator, I want the app to explain what's missing instead of crashing, so that setup is obvious.*
- AC1 With no Supabase keys in development, the app runs as a single local workspace (no sign-in) and stores data in `.data/`; a banner says so and links to Setup.
- AC2 In production, local mode is only enabled with `WEBSCRAPEX_LOCAL_MODE=true`; otherwise sign-in pages show "Not set up yet".
- AC3 `/setup` lists every env variable with set / required / optional status (never values), database steps and cron steps.
- AC4 Features with a missing key show a designed setup state (AI extract, schedules cron, API keys/schedules without service role, missing tables → "run schema.sql").

### F-14 AI extraction
*As Meera, I want to describe the data in plain words when selectors are brittle.*
- AC1 `/ai-scraper`: URL + prompt (+ example prompts) → JSON from Gemini (`GEMINI_MODEL`, default `gemini-2.5-flash`).
- AC2 If the answer contains an array of objects it is shown as a table with CSV download; raw JSON is always shown with Copy.
- AC3 robots.txt and rate limits (F-09, F-10) apply; only the page's visible text (plus link/image hints) is sent to the model.
- AC4 Without `GOOGLE_AI_API_KEY` the page shows how to enable it.

### F-15 API access
*As Meera, I want an API key and documented endpoints, so that my workflow can scrape on its own.*
- AC1 `/api-access`: create named keys (max 10), key shown once with Copy, list with prefix / created / last used, revoke with confirmation.
- AC2 Keys are stored as SHA-256 hashes; sent as `Authorization: Bearer wsx_…`.
- AC3 Code samples for curl, JavaScript, Python and n8n use the current origin; an endpoint table lists every route.
- AC4 All `/api/v2/*` routes accept a key or a Supabase access token; keys cannot create or revoke keys.
- AC5 v1 endpoints keep working: `POST /api/v2/scrape` (accepts `fastMode`), `GET /api/scrape/content?id=`, `POST /api/v2/scrape/assets`, `POST /api/v2/scrape/ai`.

### F-16 Schedules and webhooks
*As Riya, I want a scrape to repeat weekly and notify my sheet, so that I don't have to remember.*
- AC1 "Schedule" on a result opens a dialog: daily/weekly/monthly + optional https webhook; it reuses the run's mode, engine and selectors.
- AC2 `/schedules` shows each schedule's URL, frequency, mode, field count, webhook badge, next run, last run (linked); pause/resume switch; Run now; Delete.
- AC3 `GET /api/cron/schedules` with `Bearer CRON_SECRET` runs up to 3 due schedules; `vercel.json` calls it daily.
- AC4 After each scheduled run the webhook receives `{event, scheduleId, jobId, url, error, title, rows, completedAt}`; delivery failures are logged on the job.
- AC5 Without `CRON_SECRET` the page explains automatic runs are off; Run now still works.

### F-17 Save images to storage
*As Arjun, I want to keep copies of a page's images, so that my audit doesn't break when the site changes.*
- AC1 Design tab → "Save to storage" copies up to 40 of the job's images (≤ 5 MB each, image MIME types only) into the job's storage folder.
- AC2 Each image's robots.txt is checked; skipped images are counted in the toast.
- AC3 Saved files are served through `/api/v2/jobs/{id}/files/assets/…` after an ownership check.

### F-18 Settings
- AC1 Theme: Light / Dark / System.
- AC2 Scrape defaults (mode, engine) saved per browser and applied when the console opens.
- AC3 Usage: scrapes used this minute / hour vs. limits.
- AC4 Account: name/email, Sign out, Change password (local mode shows "Connect Supabase").

### F-19 Admin console
*As the operator, I want a quick view of service health and usage.*
- AC1 `/admin` is visible in nav and usable only for emails in `ADMIN_EMAILS` (v1's hard-coded password removed); others see "Admins only".
- AC2 Shows total jobs, completed, failed, last 24 h, user count, most scraped hosts (bars), recent failures with errors, link to `/api/health`.

### F-20 Health check
- AC1 `GET /api/health` returns status, mode, per-check status (app, database, storage) and feature flags; 200 when healthy, 503 when degraded; never cached.

### F-21 Docs
- AC1 `/docs` (public) explains first run, modes and engines (table), selector fields with an example, exports, robots.txt and rate limits, schedules, and the API; sticky table of contents on desktop, horizontal on mobile.

### F-22 Command menu
- AC1 Ctrl/⌘+K (or the search button) opens a palette to jump to any page, switch theme, or scrape a pasted URL.

### F-23 Theme
- AC1 Light, dark and system themes, chosen without a flash of the wrong theme; dark palette tuned separately (see DESIGN.md).

### F-24 Responsive layout and navigation
- AC1 No horizontal page scroll at 360, 390, 768, 1024, 1280, 1536 px.
- AC2 ≥ 1024 px: left rail navigation. < 1024 px: top bar + bottom tab bar (Console, History, Schedules, AI, More) and a bottom sheet with all pages.
- AC3 Touch targets ≥ 44 px on mobile; wide tables scroll inside their container.

### F-25 PWA and offline
- AC1 Web manifest with name, colours, 192/512 and maskable icons, shortcuts; apple-touch icon and theme-color for light and dark.
- AC2 Service worker precaches static assets and an `/offline` page; pages are network-first; `/api/*` and `/auth/*` are never cached.
- AC3 Installable on Android (Chrome) and iOS (Add to Home Screen).

### F-26 v1 data compatibility
- AC1 Jobs created by v1 (rows in `websites` with `result.json` in Storage or only a `metadata` row) open in the new result page with a "captured by v1" warning.
- AC2 v1 tables are not altered destructively; `supabase/schema.sql` is idempotent.

## 5. User flows

**Flow A — First scrape with selectors (Riya)**
1. Open `/` → (sign in if needed) → paste `news.ycombinator.com`.
2. Pre-flight shows "Allowed by robots.txt" and quota 10/10.
3. Fields → Presets → "Hacker News front page" (row selector + 4 fields).
4. Run scrape → progress strip → result page opens on the Data tab with ~30 rows.
5. Export → CSV · Selector fields → opens in Excel.

**Flow B — Site audit (Arjun)**
1. Paste client URL, mode Full audit, engine Rendered → Run.
2. Result: Overview (metadata, share preview, tech), SEO dial + findings, Design (screenshot, colours — click to copy, fonts, images).
3. Design → Save to storage; Export → Full JSON and PDF snapshot.

**Flow C — Automation (Meera)**
1. `/api-access` → Create key "n8n" → copy.
2. In n8n, HTTP Request node `POST /api/v2/scrape` with the key and fields.
3. On a result page → Schedule weekly with webhook → `/schedules` shows next run.
4. Cron calls `/api/cron/schedules` → run → webhook receives the summary.

**Flow D — Sign-up**
1. `/signup` → name, email, password → "Email me a code".
2. Inbox → 6-digit code → Verify → signed in → console.

**Flow E — Operator setup**
1. Deploy → open `/setup` → see missing variables.
2. Run `supabase/schema.sql`, add keys, set `ADMIN_EMAILS`, `CRON_SECRET` → redeploy → `/admin` and `/api/health` show healthy.

## 6. Screen inventory

| Route | Purpose | Key elements |
|---|---|---|
| `/` Console | Start a run | GET URL bar, mode cards, engine toggle, Fields editor + presets, progress strip, pre-flight panel, recent runs |
| `/result/[id]` | One run | Breadcrumb, title/URL, readout strip, actions (Export, Run again, Schedule, Delete), tabs |
| `/collections` History | All runs | Search, status filter, job table with row menu, pagination, empty state |
| `/schedules` | Recurring runs | Cron notice, schedule cards with switch / Run now / Delete |
| `/ai-scraper` | AI extraction | URL, prompt, example chips, result table + JSON, setup state |
| `/api-access` | Keys and API | Key creation, one-time reveal, key list, code tabs, endpoint table |
| `/docs` | Help | Sticky TOC, seven sections |
| `/settings` | Preferences | Theme, defaults, usage, account |
| `/admin` | Operator view | Stat strip, top hosts, recent failures |
| `/setup` | Configuration | Env checklist, database steps, cron steps |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Auth | Split screen with a sample result table; Google button; forms |
| `/offline` | PWA fallback | Offline message, retry |
| 404 / error | Recovery | Explanation and links to console/history/setup |

## 7. Content and data

- Real product copy written for scraping (no placeholder marketing text). Presets target real public pages (Hacker News) and common patterns (articles, product cards).
- Entities: **Job** (`websites` row + `result.json`), **Log line**, **Result** (metadata, datasets, audit sections), **API key**, **Schedule**, **Profile**, **Verification token**, **Stored file**.
- Sample data: none is seeded; the auth screens show a static example of a Hacker News result so new visitors see what they will get.

## 8. Non-functional requirements

- **Responsive:** mobile-first; checked at 360/390/768/1024/1280/1536 px; no horizontal page scroll.
- **Theme:** light/dark/system via `next-themes`, no flash; WCAG AA text contrast in both.
- **PWA/offline:** see F-25.
- **Performance:** Lighthouse mobile ≥ 90 on public pages; fonts self-hosted (`next/font/local`); motion via `LazyMotion`; command menu loaded on demand; server components by default.
- **Accessibility:** ≥ 95 Lighthouse; skip link; labelled controls; visible focus rings; radio groups for segmented controls; tables with captions; `prefers-reduced-motion` honoured.
- **SEO:** metadata and Open Graph per page, `robots.txt` and `sitemap.xml` for public pages; private pages `noindex`.
- **Security/privacy:** F-09–F-12; security headers (nosniff, frame DENY, referrer policy, permissions policy); secrets server-only; env values never displayed; keys hashed; private Storage bucket recommended.

## 9. Risks, assumptions, open questions

| # | Item | Type |
|---|---|---|
| R1 | Rate limits and robots cache are in process memory: on multi-instance serverless each instance has its own counters. Fine for a small team; a shared store (Redis/Upstash) is needed for strict global limits. | Risk |
| R2 | The rendered engine on Vercel needs a Chromium pack URL and fits within the 60 s function limit only for typical pages. | Risk |
| R3 | v1 committed an admin password to git history (and the remote). The new admin uses `ADMIN_EMAILS`, but **the owner should change any account that reused that password**. | Risk |
| R4 | The v1 Supabase Storage bucket may be public, which makes `result.json` readable by anyone who knows a job id. Owner should switch the `scrapes` bucket to private (the app works either way). | Risk |
| A1 | Supabase project, Mailjet sender and Google OAuth client already exist (v1 used them). | Assumption |
| Q1 | Production domain for `NEXT_PUBLIC_SITE_URL` and the OAuth redirect URL. | Open — owner |
| Q2 | Gemini API key, if AI extraction should be on. | Open — owner |
| Q3 | Which emails are admins (`ADMIN_EMAILS`). | Open — owner |
| Q4 | Desired default rate limits for production. | Open — owner |
