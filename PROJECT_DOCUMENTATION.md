# WebScrapeX - Complete Project Documentation

## Project Overview

**WebScrapeX** is a modern, production-ready web scraping and design intelligence platform that enables users to extract and analyze design systems from any website. The application provides comprehensive data extraction including colors, fonts, images, technologies, metadata, SEO analysis, and AI-powered content extraction.

---

## Table of Contents

1. [Project Information](#project-information)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Pages & Functionality](#pages--functionality)
5. [Core Libraries & Dependencies](#core-libraries--dependencies)
6. [API Routes](#api-routes)
7. [Components](#components)
8. [Database Schema](#database-schema)
9. [Features](#features)
10. [Environment Variables](#environment-variables)

---

## 1. Project Information

| Property | Value |
|----------|-------|
| **Project Name** | WebScrapeX |
| **Version** | 0.1.0 |
| **Framework** | Next.js 16.1.1 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3.4 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |

---

## 2. Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.1 | React framework with App Router for server-side rendering and API routes |
| **React** | 19.2.3 | UI library for building interactive user interfaces |
| **TypeScript** | 5 | Type-safe JavaScript for better code quality and developer experience |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework for rapid UI development |
| **Framer Motion** | 12.26.1 | Animation library for smooth page transitions and micro-interactions |
| **Radix UI** | Various | Accessible, unstyled UI components (Dialog, Dropdown, Tabs, etc.) |
| **Lucide React** | 0.562.0 | Beautiful & consistent icon library |
| **Recharts** | 3.8.0 | Charting library for analytics visualization |
| **React Syntax Highlighter** | 16.1.0 | Code syntax highlighting for API examples |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.90.1 | PostgreSQL database, authentication, and file storage |
| **Cheerio** | 1.1.2 | Fast HTML parser for static content extraction |
| **Puppeteer** | 22.6.0 | Headless browser for dynamic content extraction |
| **Puppeteer Extra** | 3.3.6 | Enhanced Puppeteer with plugin support |
| **Stealth Plugin** | 2.11.2 | Bypasses bot detection for reliable scraping |
| **Chromium Min** | 143.0.4 | Serverless-compatible Chromium for Vercel deployment |
| **Google Generative AI** | 0.24.1 | AI integration for natural language data extraction |
| **Mozilla Readability** | 0.6.0 | Content extraction and article parsing |
| **jsdom** | 28.0.0 | DOM implementation for server-side HTML manipulation |
| **JSON2CSV** | 6.0.0-alpha.2 | Convert JSON data to CSV format for exports |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and quality enforcement |
| **TypeScript** | Static type checking |
| **PWA Plugin** | Progressive Web App support for offline functionality |

---

## 3. Project Structure

```
web-scrape-x/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── ai-scraper/               # AI extraction page
│   ├── api-access/               # API documentation page
│   ├── collections/              # User's scraped history
│   ├── docs/                     # Documentation page
│   ├── login/                    # Login page
│   ├── signup/                   # Registration page
│   ├── settings/                 # User settings
│   ├── result/[id]/              # Scrape results page
│   ├── admin/                    # Admin dashboard
│   ├── auth/                     # Auth callback handlers
│   ├── forgot-password/          # Password recovery
│   └── api/                      # API routes
│       ├── health/               # Health check endpoint
│       ├── scrape/               # Scraping endpoints
│       └── v2/                   # Version 2 API
│
├── components/                   # React components
│   ├── cards/                    # Result display cards
│   ├── layout/                   # Layout components
│   ├── ui/                       # Reusable UI components
│   ├── auth/                     # Authentication components
│   ├── home/                     # Home page components
│   └── modals/                   # Modal components
│
├── lib/                          # Core libraries
│   ├── scraper.ts                # Main scraping engine
│   ├── scraper-types.ts          # TypeScript types
│   ├── extractors/               # Data extraction modules
│   ├── supabase.ts               # Database client
│   ├── cache.ts                  # Caching layer
│   ├── rateLimiter.ts            # Rate limiting
│   ├── queue.ts                  # Job queue system
│   ├── logger.ts                 # Logging utility
│   └── retry.ts                  # Retry logic
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   ├── useResponsive.ts          # Responsive design hook
│   ├── useFastFetch.ts           # Optimized fetching
│   └── useCachedData.ts          # Data caching hook
│
├── scripts/                      # Utility scripts
│   ├── queue-worker.js           # Background job processor
│   └── cleanup.js                # Cleanup script
│
├── public/                       # Static assets
│   ├── sw.js                     # Service worker for PWA
│   └── workbox-*.js              # Workbox for offline support
│
└── ...config files               # Configuration files
```

---

## 4. Pages & Functionality

### Page 1: Home Page (`/`)

**File:** `app/page.tsx` → `components/home/HomeContent.tsx`

**Purpose:** Main dashboard and landing page for the application.

**Key Features:**
- Hero section with animated text reveal ("Design Intelligence")
- URL input form for initiating scrapes
- Scrape mode selector with 4 options:
  - **Full Mode:** Complete analysis (colors, fonts, images, tech, metadata)
  - **Social Mode:** Open Graph, Twitter cards, social metadata
  - **Content Mode:** Article content, readability analysis
  - **Design Mode:** Design-focused extraction (colors, fonts, images)
- Feature showcase cards (Full Stack Analysis, Design DNA, Asset Vault, Social & Content)
- Visual Builder teaser section (upcoming feature)
- User's recent scrape history (if logged in)
- Analytics dashboard for users with history
- Mobile-responsive design with touch optimization

**Components Used:**
- `AnimatedButton`, `AnimatedCard`, `DynamicBackground`
- `ScrapeModeSelector`, `HistoryCard`
- `AnalyticsDashboard` (lazy-loaded)

---

### Page 2: Documentation Page (`/docs`)

**File:** `app/docs/page.tsx`

**Purpose:** Comprehensive user guide and API documentation.

**Key Features:**
- Three tabbed sections:
  1. **User Guide:** 3-step process (Input URL → Analyze → Export)
  2. **Standard API:** API key management and authentication
  3. **AI Extraction:** Natural language prompt documentation
- Step-by-step instructions with visual cards
- Pro tips and best practices
- Links to API Access page for key generation

**Components Used:**
- `Card`, `Tabs`, `Button`
- `Sidebar`, `DynamicBackground`

---

### Page 3: Collections Page (`/collections`)

**File:** `app/collections/page.tsx`

**Purpose:** Archive of all previously scraped websites.

**Key Features:**
- Grid display of history cards
- Each card shows:
  - Website thumbnail/favicon
  - Title and URL
  - Date scraped
  - Delete option
- Sorted by most recent first
- Requires authentication (redirects to login if not authenticated)
- Total item count display

**Components Used:**
- `HistoryCard`, `Sidebar`, `DynamicBackground`
- `ScrollFadeIn` animation wrapper

---

### Page 4: API Access Page (`/api-access`)

**File:** `app/api-access/page.tsx`

**Purpose:** Developer API integration and key management.

**Key Features:**
- **API Key Management:**
  - Reveal/regenerate API key
  - Copy to clipboard functionality
  - Rate limit display (100 requests/minute)
- **Proxy Rotation:** Enterprise feature for bypassing rate limits
- **Webhook Configuration:** Real-time notifications for automated jobs
- **Integration Guide:** Code examples for:
  - ActivePieces (workflow automation)
  - cURL commands
  - Node.js fetch examples

**Components Used:**
- `Card`, `Input`, `Button`, `Tabs`, `Switch`
- `Sidebar`, `DynamicBackground`

---

### Page 5: Settings Page (`/settings`)

**File:** `app/settings/page.tsx`

**Purpose:** User account configuration and preferences.

**Key Features:**
- Four tabbed sections:
  1. **General:** Theme toggle (light/dark), export defaults
  2. **Billing:** Subscription management, next invoice details
  3. **Account:** Profile information, display name
  4. **Notifications:** Email preferences, weekly digest

**Components Used:**
- `Card`, `Input`, `Button`, `Tabs`, `ThemeToggle`
- `Sidebar`, `DynamicBackground`

---

### Page 6: AI Scraper Page (`/ai-scraper`)

**File:** `app/ai-scraper/page.tsx`

**Purpose:** AI-powered natural language data extraction.

**Key Features:**
- URL input for target website
- Natural language prompt textarea
- Example prompt: "Extract all product names and prices from this page"
- JSON output display with syntax highlighting
- Copy to clipboard for extracted data
- Loading states and error handling

**How it Works:**
1. User enters URL and describes what to extract
2. AI processes the page content
3. Returns structured JSON data
4. No CSS selectors or XPath needed

**Components Used:**
- `Input`, `AnimatedButton`, `DynamicBackground`
- `ReactSyntaxHighlighter` for code display

---

### Page 7: Login Page (`/login`)

**File:** `app/login/page.tsx`

**Purpose:** User authentication.

**Key Features:**
- Email/password login form
- Social authentication options:
  - Google OAuth
  - GitHub OAuth
- Animated background gradients
- Link to signup page for new users
- Password visibility toggle
- Error message display
- Redirect to return URL after login

**Components Used:**
- `AuthCard`, `LoginForm`, `SocialAuth`
- `DynamicBackground`

---

### Page 8: Signup Page (`/signup`)

**File:** `app/signup/page.tsx`

**Purpose:** New user registration.

**Key Features:**
- Email/password registration form
- Password strength indicator
- Social signup options (Google, GitHub)
- Terms of service acceptance
- Email verification flow
- Link to login for existing users

**Components Used:**
- `AuthCard`, `SignupForm`, `SocialAuth`
- `DynamicBackground`

---

### Page 9: Result Page (`/result/[id]`)

**File:** `app/result/[id]/page.tsx`

**Purpose:** Display detailed scrape results.

**Key Features:**
- Real-time status polling (pending, processing, completed, failed)
- Multiple result cards displayed in grid:
  1. **MetadataCard:** Title, description, favicon, keywords
  2. **InsightsCard:** Design intelligence scores, visual cohesion, tech maturity
  3. **LinkedInCard:** LinkedIn profile data (if applicable)
  4. **SocialCard:** Open Graph, Twitter cards, social links
  5. **ContentAnalysisCard:** Word count, reading time, headings
  6. **TechCard:** Detected technologies and frameworks
  7. **SEOCard:** SEO audit with recommendations
  8. **ColorPaletteCard:** Extracted color palette with hex codes
  9. **FontsCard:** Detected fonts with preview
  10. **ImageGalleryCard:** All extracted images
  11. **AssetsCard:** CSS and JS files
  12. **LinksCard:** Internal and external links
  13. **RawHTMLCard:** Full HTML source viewer

- Floating export button for:
  - JSON export
  - PDF export
  - Color guide
  - Asset download

**Components Used:**
- All card components from `components/cards/`
- `Sidebar`, `Header`, `FloatingExportButton`
- `Skeleton` loading states

---

### Page 10: Forgot Password Page (`/forgot-password`)

**File:** `app/forgot-password/page.tsx`

**Purpose:** Password recovery.

**Key Features:**
- Email input for password reset
- Sends reset link via Supabase Auth
- Success confirmation message

---

### Page 11: Admin Page (`/admin`)

**File:** `app/admin/page.tsx`

**Purpose:** Administrative dashboard (requires admin role).

**Key Features:**
- System health monitoring
- User management
- Scrape statistics
- Error logs

---

## 5. Core Libraries & Dependencies

### Scraping Libraries

| Library | Purpose |
|---------|---------|
| **cheerio** | Fast HTML parsing for static content. jQuery-like API for server-side DOM manipulation. Used in "Fast Mode" scraping. |
| **puppeteer-core** | Headless Chrome control for dynamic content. Renders JavaScript, captures screenshots, generates PDFs. Used in "Deep Mode" scraping. |
| **puppeteer-extra** | Puppeteer wrapper with plugin ecosystem support. |
| **puppeteer-extra-plugin-stealth** | Evades bot detection by masking automation signatures. Essential for scraping protected sites. |
| **@sparticuz/chromium-min** | Lightweight Chromium binary optimized for serverless environments (Vercel, AWS Lambda). |
| **@mozilla/readability** | Firefox's reader mode engine. Extracts main article content, removes ads/navigation. |
| **linkedin-profile-scraper** | Specialized scraper for LinkedIn profile data extraction. |

### AI & Processing

| Library | Purpose |
|---------|---------|
| **@google/generative-ai** | Google Gemini AI integration for natural language data extraction. Converts prompts to structured JSON. |
| **jsdom** | JavaScript implementation of DOM for server-side HTML manipulation and testing. |
| **json2csv** | Converts scraped JSON data to CSV format for spreadsheet exports. |

### UI & Animation

| Library | Purpose |
|---------|---------|
| **framer-motion** | Production-ready animation library. Used for page transitions, card animations, scroll effects. |
| **gsap** | Professional animation library for complex timeline animations. |
| **@studio-freight/lenis** | Smooth scroll library for enhanced user experience. |
| **lottie-react** | Lottie animation player for vector animations. |
| **tinycolor2** | Color manipulation library for palette generation and accessibility checks. |
| **cmdk** | Command menu component (Cmd+K) for quick navigation. |
| **recharts** | React charting library built on D3 for analytics visualization. |
| **react-syntax-highlighter** | Syntax highlighting for code blocks in API documentation. |

### Data & State

| Library | Purpose |
|---------|---------|
| **@supabase/supabase-js** | Supabase client for database operations, real-time subscriptions. |
| **@supabase/auth-helpers-nextjs** | Authentication helpers for Next.js with SSR support. |
| **next-themes** | Theme management for dark/light mode switching. |
| **nextjs-toploader** | Progress bar indicator for page transitions. |

### Styling

| Library | Purpose |
|---------|---------|
| **tailwindcss** | Utility-first CSS framework. Enables rapid UI development. |
| **tailwindcss-animate** | Animation plugin for Tailwind with pre-built animations. |
| **tailwind-merge** | Merges Tailwind classes without conflicts. |
| **class-variance-authority** | Creates variant-based component APIs. |
| **clsx** | Conditional className construction utility. |

### Radix UI Components

| Component | Purpose |
|-----------|---------|
| **@radix-ui/react-dialog** | Accessible modal dialog component |
| **@radix-ui/react-dropdown-menu** | Dropdown menu with keyboard navigation |
| **@radix-ui/react-tabs** | Tab component with keyboard support |
| **@radix-ui/react-switch** | Toggle switch component |
| **@radix-ui/react-progress** | Progress bar component |
| **@radix-ui/react-scroll-area** | Custom scrollable areas |
| **@radix-ui/react-label** | Accessible form labels |

### PWA & Performance

| Library | Purpose |
|---------|---------|
| **@ducanh2912/next-pwa** | Progressive Web App support. Enables offline functionality, caching. |

---

## 6. API Routes

### `/api/health`
- **Method:** GET
- **Purpose:** Health check endpoint for monitoring
- **Returns:** Status 200 if service is healthy

### `/api/scrape`
- **Method:** POST
- **Purpose:** Initiate a new scrape job
- **Body:** `{ url: string }`
- **Returns:** `{ id: string, status: string }`

### `/api/scrape/content`
- **Method:** GET
- **Purpose:** Retrieve scraped content by ID
- **Params:** `id` (website ID)
- **Returns:** Full scrape result JSON

### `/api/v2/scrape`
- **Method:** POST
- **Purpose:** Version 2 scraping with enhanced features
- **Body:** `{ url: string, mode: 'full' | 'social' | 'content' | 'design' }`
- **Returns:** `{ id: string, status: string }`

### `/api/v2/scrape/ai`
- **Method:** POST
- **Purpose:** AI-powered data extraction
- **Body:** `{ url: string, prompt: string }`
- **Returns:** `{ data: any }` - Extracted structured data

---

## 7. Components

### Layout Components (`components/layout/`)

| Component | Purpose |
|-----------|---------|
| **Sidebar** | Navigation sidebar with links to all pages |
| **Header** | Page header with title, URL, and actions |
| **MotionProvider** | Framer Motion provider wrapper |
| **Navbar** | Top navigation bar |

### Card Components (`components/cards/`)

| Component | Purpose |
|-----------|---------|
| **MetadataCard** | Displays page title, description, favicon, keywords |
| **ColorPaletteCard** | Shows extracted color palette with hex codes |
| **FontsCard** | Lists detected fonts with preview |
| **ImageGalleryCard** | Grid gallery of all extracted images |
| **AssetsCard** | Lists CSS/JS files with download links |
| **LinksCard** | Internal and external link display |
| **TechCard** | Detected technologies and frameworks |
| **RawHTMLCard** | HTML source code viewer |
| **InsightsCard** | Design intelligence scores |
| **SocialCard** | Open Graph and social metadata |
| **LinkedInCard** | LinkedIn profile extraction results |
| **ContentAnalysisCard** | Content statistics and analysis |
| **SEOCard** | SEO audit with recommendations |

### UI Components (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| **Button** | Styled button with variants |
| **Input** | Form input component |
| **Card** | Container card component |
| **Dialog** | Modal dialog |
| **Tabs** | Tab navigation |
| **Switch** | Toggle switch |
| **Skeleton** | Loading placeholder |
| **Badge** | Status badge |
| **Progress** | Progress bar |
| **AnimatedButton** | Button with hover animations |
| **AnimatedCard** | Card with entrance animations |
| **DynamicBackground** | Animated gradient background |
| **MotionWrappers** | Reusable motion components |
| **LottieLoader** | Lottie animation loader |

### Auth Components (`components/auth/`)

| Component | Purpose |
|-----------|---------|
| **AuthCard** | Card wrapper for auth forms |
| **LoginForm** | Email/password login form |
| **SignupForm** | Registration form |
| **SocialAuth** | Social login buttons (Google, GitHub) |

---

## 8. Database Schema (Supabase)

### Tables

#### `websites`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| url | text | Scraped URL |
| status | text | pending, processing, completed, failed |
| created_at | timestamp | Creation time |
| completed_at | timestamp | Completion time |
| total_assets | integer | Number of extracted assets |

#### `metadata`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| website_id | uuid | Foreign key to websites |
| title | text | Page title |
| description | text | Meta description |
| keywords | text[] | Meta keywords |
| favicon | text | Favicon URL |
| color_palette | text[] | Extracted colors |
| fonts | text[] | Extracted fonts |
| technologies | text[] | Detected technologies |

#### `assets`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| website_id | uuid | Foreign key to websites |
| file_type | text | image, css, js |
| url | text | Asset URL |
| created_at | timestamp | Upload time |

#### `logs`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| website_id | uuid | Foreign key to websites |
| message | text | Log message |
| type | text | info, error, warning, success |
| created_at | timestamp | Log time |

---

## 9. Features

### Core Features

1. **Hybrid Scraping Engine**
   - Fast Mode (Cheerio): Quick static content extraction
   - Deep Mode (Puppeteer): JavaScript rendering, lazy loading support
   - Automatic fallback from Fast to Deep mode

2. **Multiple Extractors**
   - Metadata: Title, description, keywords, favicon
   - Colors: CSS colors, background colors, gradients
   - Fonts: Google Fonts, custom fonts, font stacks
   - Technologies: Frameworks, libraries, CMS detection
   - Images: All images including lazy-loaded
   - Links: Internal and external link mapping
   - Social: Open Graph, Twitter Cards
   - LinkedIn: Profile data extraction
   - SEO: Comprehensive audit with recommendations

3. **AI-Powered Extraction**
   - Natural language prompts
   - Structured JSON output
   - No selector knowledge required
   - Context-aware extraction

4. **Background Processing**
   - Queue-based job system
   - Non-blocking operations
   - Real-time status updates via polling

5. **Intelligent Caching**
   - In-memory cache for repeated requests
   - Reduces server load
   - Faster response times

6. **Rate Limiting**
   - Per-user request limits
   - Prevents abuse
   - Configurable thresholds

7. **Authentication**
   - Email/password authentication
   - OAuth providers (Google, GitHub)
   - Session management
   - Row-level security (RLS)

8. **Export Options**
   - JSON export
   - PDF generation
   - Color guide (ASE, CSS, Tailwind)
   - Asset downloads (images, CSS, JS)
   - CSV export

### Advanced Features

9. **Screenshot & PDF Capture**
   - Full-page screenshots
   - PDF snapshots of scraped pages
   - Stored in Supabase Storage

10. **Responsive Design**
    - Mobile-optimized UI
    - Touch-friendly interactions
    - Adaptive layouts

11. **Dark Mode**
    - System preference detection
    - Manual toggle
    - Persistent preference

12. **Progressive Web App**
    - Offline support
    - Install on mobile/desktop
    - Background sync

13. **SEO Optimized**
    - Server-side rendering
    - Meta tags
    - Sitemap generation
    - Robots.txt

---

## 10. Environment Variables

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI (for AI extraction)
GOOGLE_AI_KEY=your_google_ai_key

# Browser (for Puppeteer)
BROWSER_WS_ENDPOINT=your_browser_endpoint  # Optional: for remote browser
CHROME_EXECUTABLE_PATH=/path/to/chrome     # Optional: for local development
```

### Optional Variables

```env
# Proxy
PROXY_URL=your_proxy_url

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Deployment
VERCEL=1                    # Enable Vercel optimizations
AWS_LAMBDA_FUNCTION_VERSION # Auto-detected for Lambda
```

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/webscrapex.git
cd webscrapex

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:turbo` | Start with TurboPack |
| `npm run build` | Build for production |
| `npm run start:prod` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run tests |

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel --prod
```

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Docker

```bash
docker build -t webscrapex .
docker run -p 3000:3000 --env-file .env.local webscrapex
```

---

## Conclusion

WebScrapeX is a comprehensive web scraping and design intelligence platform built with modern technologies. It provides a user-friendly interface for extracting and analyzing website data, with both a web UI and REST API for programmatic access. The project demonstrates proficiency in:

- Full-stack TypeScript development
- Modern React patterns with Next.js
- Database design with Supabase
- Web scraping with Cheerio and Puppeteer
- AI integration with Google Gemini
- Responsive design and animations
- Authentication and authorization
- Production deployment and optimization

---

*Documentation generated for WebScrapeX - College Project Submission*

*Date: May 2026*
