const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber } = require('docx');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'WebScrapeX_Project_Documentation.docx');

async function generateDoc() {
    const doc = new Document({
        sections: [
            // COVER PAGE
            {
                properties: {},
                children: [
                    new Paragraph({ spacing: { before: 2000 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: "WebScrapeX",
                                bold: true,
                                size: 80,
                                color: "7c3aed"
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400 },
                        children: [
                            new TextRun({
                                text: "Design Intelligence Platform",
                                size: 40,
                                color: "db2777"
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 600 },
                        children: [
                            new TextRun({
                                text: "Web Scraping & Analysis Application",
                                size: 28,
                                italics: true
                            })
                        ]
                    }),
                    new Paragraph({ spacing: { before: 1500 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: "Project Report for College Submission",
                                size: 24
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400 },
                        children: [
                            new TextRun({
                                text: `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                                size: 22
                            })
                        ]
                    }),
                    new Paragraph({ spacing: { before: 1000 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: "Technologies Used:", bold: true, size: 22 })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200 },
                        children: [
                            new TextRun({ text: "Next.js 16  |  React 19  |  TypeScript  |  Supabase  |  Puppeteer  |  Google AI", size: 20 })
                        ]
                    }),
                ]
            },
            // TABLE OF CONTENTS
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "Table of Contents", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 400 } }),
                    ...[
                        "1. Project Overview",
                        "2. Technology Stack",
                        "3. Project Structure",
                        "4. Core Features",
                        "5. System Architecture",
                        "6. Pages & Functionality",
                        "7. API Routes",
                        "8. Database Schema",
                        "9. Key Components",
                        "10. Environment Variables",
                        "11. Getting Started",
                        "12. Conclusion"
                    ].map(item => new Paragraph({
                        spacing: { before: 150 },
                        children: [new TextRun({ text: item, size: 24 })]
                    }))
                ]
            },
            // PAGE 1: PROJECT OVERVIEW
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "1. Project Overview", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "WebScrapeX",
                                bold: true
                            }),
                            new TextRun({
                                text: " is a modern, production-ready web scraping and design intelligence platform built with Next.js 16, TypeScript, and Supabase. It enables users to extract and analyze design systems from any website, including colors, fonts, images, technologies, metadata, and SEO information."
                            })
                        ]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Project Objectives" })]
                    }),
                    ...[
                        "Extract design elements (colors, fonts, images) from any website",
                        "Detect technologies and frameworks used by websites",
                        "Provide SEO analysis and content insights",
                        "Offer AI-powered natural language data extraction",
                        "Enable API access for developer integration",
                        "Store and organize scraped data in user collections"
                    ].map(item => new Paragraph({
                        spacing: { before: 150 },
                        children: [new TextRun({ text: `• ${item}` })]
                    })),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Key Statistics" })]
                    }),
                    createTable([
                        ["Metric", "Value"],
                        ["Framework", "Next.js 16.1.1 (App Router)"],
                        ["Language", "TypeScript 5"],
                        ["Total Pages", "11 Pages"],
                        ["Components", "40+ Components"],
                        ["API Routes", "10+ Endpoints"],
                        ["Dependencies", "75+ Packages"]
                    ])
                ]
            },
            // PAGE 2: TECHNOLOGY STACK
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "2. Technology Stack", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Frontend Technologies" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Technology", "Version", "Purpose"],
                        ["Next.js", "16.1.1", "React framework with App Router for SSR and API routes"],
                        ["React", "19.2.3", "UI library for building interactive components"],
                        ["TypeScript", "5", "Type-safe JavaScript for better code quality"],
                        ["Tailwind CSS", "3.4.1", "Utility-first CSS framework for rapid UI development"],
                        ["Framer Motion", "12.26.1", "Animation library for smooth transitions"],
                        ["Radix UI", "Various", "Accessible, unstyled UI components"],
                        ["Lucide React", "0.562.0", "Beautiful & consistent icon library"],
                        ["Recharts", "3.8.0", "Charting library for analytics visualization"]
                    ]),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Backend Technologies" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Technology", "Version", "Purpose"],
                        ["Supabase", "2.90.1", "PostgreSQL database, authentication, and storage"],
                        ["Cheerio", "1.1.2", "Fast HTML parser for static content extraction"],
                        ["Puppeteer", "22.6.0", "Headless browser for dynamic content"],
                        ["Puppeteer Extra", "3.3.6", "Enhanced Puppeteer with plugin support"],
                        ["Stealth Plugin", "2.11.2", "Bypasses bot detection for reliable scraping"],
                        ["Google Generative AI", "0.24.1", "AI integration for natural language extraction"],
                        ["Mozilla Readability", "0.6.0", "Content extraction and article parsing"],
                        ["jsdom", "28.0.0", "DOM implementation for server-side manipulation"]
                    ])
                ]
            },
            // PAGE 3: PROJECT STRUCTURE
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "3. Project Structure", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        children: [new TextRun({ text: "The project follows Next.js 16 App Router conventions with a clean separation of concerns between pages, components, and core libraries." })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Directory Overview" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Directory", "Purpose"],
                        ["app/", "Next.js App Router pages and API routes"],
                        ["components/", "Reusable React components (40+ components)"],
                        ["lib/", "Core libraries (scraper, database, utilities)"],
                        ["hooks/", "Custom React hooks (useAuth, useResponsive, etc.)"],
                        ["scripts/", "Utility scripts (queue worker, cleanup)"],
                        ["public/", "Static assets and PWA files"]
                    ]),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "App Directory Structure" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Path", "Description"],
                        ["app/page.tsx", "Home/Landing page"],
                        ["app/layout.tsx", "Root layout with providers"],
                        ["app/api/", "API route handlers"],
                        ["app/result/[id]/", "Dynamic result pages"],
                        ["app/docs/", "Documentation page"],
                        ["app/collections/", "User's scrape history"],
                        ["app/ai-scraper/", "AI-powered extraction"],
                        ["app/login/", "Authentication pages"]
                    ])
                ]
            },
            // PAGE 4: CORE FEATURES
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "4. Core Features", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    ...[
                        { title: "Hybrid Scraping Engine", desc: "Fast mode (Cheerio) for static content + Deep mode (Puppeteer) for JavaScript-rendered content with automatic fallback." },
                        { title: "Multiple Extractors", desc: "Comprehensive extraction including metadata, colors, fonts, technologies, social data, LinkedIn profiles, and SEO analysis." },
                        { title: "AI-Powered Extraction", desc: "Natural language prompts for structured data extraction without writing CSS selectors or XPath." },
                        { title: "Background Processing", desc: "Queue-based job system for non-blocking operations with real-time status updates via polling." },
                        { title: "Intelligent Caching", desc: "In-memory caching for repeated requests, reducing server load and improving response times." },
                        { title: "Rate Limiting", desc: "Per-user request limits (100 req/min) to prevent abuse and ensure fair usage." },
                        { title: "SEO Analysis", desc: "Comprehensive SEO audit with actionable recommendations for improving search visibility." },
                        { title: "Export Options", desc: "Multiple export formats including JSON, PDF, color guides (ASE, CSS, Tailwind), and asset downloads." },
                        { title: "Screenshot & PDF Capture", desc: "Full-page screenshots and PDF snapshots of scraped pages stored in Supabase Storage." },
                        { title: "OAuth Authentication", desc: "Secure login with Google and GitHub OAuth providers plus email/password authentication." }
                    ].map(item => new Paragraph({
                        spacing: { before: 200 },
                        children: [
                            new TextRun({ text: `• ${item.title}: `, bold: true }),
                            new TextRun({ text: item.desc })
                        ]
                    })),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Scraping Modes" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Mode", "Speed", "Data Extracted"],
                        ["Full", "~30-60s", "Everything: colors, fonts, images, tech, metadata, SEO"],
                        ["Social", "~5-10s", "Open Graph, Twitter Cards, social metadata"],
                        ["Content", "~10-15s", "Article content, readability analysis, headings"],
                        ["Design", "~20-30s", "Colors, fonts, images, CSS files"]
                    ])
                ]
            },
            // PAGE 5: SYSTEM ARCHITECTURE
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "5. System Architecture", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        children: [new TextRun({ text: "The system follows a modern three-tier architecture with separation between presentation, business logic, and data layers." })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Architecture Diagram" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    new Paragraph({
                        shading: { fill: "f5f5f5" },
                        children: [new TextRun({ 
                            text: `
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │   Frontend      │      │   API Routes    │      │   Scraping      │
  │   (Next.js)     │─────▶│   (Next.js)     │─────▶│   Engine        │
  │   React + TS    │      │   REST API      │      │   Cheerio +     │
  │   Tailwind CSS  │      │   Authentication│      │   Puppeteer     │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
           │                        │                        │
           ▼                        ▼                        ▼
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │   Caching       │      │   Rate Limiting │      │   Database      │
  │   Layer         │      │   Queue System  │      │   Supabase      │
  │   In-Memory     │      │   100 req/min   │      │   PostgreSQL    │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
`,
                            font: "Courier New"
                        })]
                    }),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Data Flow" })]
                    }),
                    ...[
                        "User Request: User submits URL via the web interface",
                        "Authentication: System validates user session and permissions",
                        "Rate Check: Ensures user hasn't exceeded rate limits",
                        "Cache Check: Returns cached result if URL was recently scraped",
                        "Queue Job: Scraping job added to background queue",
                        "Scraping: Engine extracts data using appropriate mode",
                        "Processing: Colors, fonts, technologies extracted and processed",
                        "Storage: Results saved to database and assets to storage",
                        "Response: Frontend polls for results and displays"
                    ].map((item, index) => new Paragraph({
                        spacing: { before: 150 },
                        children: [
                            new TextRun({ text: `${index + 1}. `, bold: true }),
                            new TextRun({ text: item })
                        ]
                    }))
                ]
            },
            // PAGE 6-7: PAGES & FUNCTIONALITY
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "6. Pages & Functionality", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    createPageSection("1", "Home Page", "/", "Main dashboard and landing page for the application.",
                        ["Hero section with animated text reveal (\"Design Intelligence\")",
                         "URL input form for initiating scrapes",
                         "Scrape mode selector with 4 options (Full, Social, Content, Design)",
                         "Feature showcase cards highlighting key capabilities",
                         "Visual Builder teaser section (upcoming feature)",
                         "User's recent scrape history (if logged in)",
                         "Analytics dashboard for users with history"]),
                    createPageSection("2", "Documentation Page", "/docs", "Comprehensive user guide and API documentation.",
                        ["User Guide: 3-step process (Input → Analyze → Export)",
                         "Standard API: Authentication and key management",
                         "AI Extraction: Natural language prompt documentation",
                         "Pro tips and best practices section"]),
                    createPageSection("3", "Collections Page", "/collections", "Archive of all previously scraped websites.",
                        ["Grid display of history cards with thumbnails",
                         "Website title, URL, and scrape date display",
                         "Delete functionality for individual items",
                         "Sorted by most recent first",
                         "Requires authentication (redirects if not logged in)"]),
                    createPageSection("4", "API Access Page", "/api-access", "Developer API integration and key management.",
                        ["API key reveal/regenerate/copy functionality",
                         "Rate limit display (100 requests/minute)",
                         "Proxy rotation settings (Enterprise feature)",
                         "Webhook configuration for notifications",
                         "Code examples for ActivePieces, cURL, and Node.js"])
                ]
            },
            {
                properties: {},
                children: [
                    createPageSection("5", "AI Scraper Page", "/ai-scraper", "AI-powered natural language data extraction.",
                        ["URL input for target website",
                         "Natural language prompt textarea",
                         "JSON output display with syntax highlighting",
                         "Copy to clipboard functionality",
                         "No CSS selectors or XPath required"]),
                    createPageSection("6", "Result Page", "/result/[id]", "Display detailed scrape results with multiple cards.",
                        ["MetadataCard: Page title, description, keywords",
                         "ColorPaletteCard: Extracted color palette",
                         "FontsCard: Detected fonts with preview",
                         "ImageGalleryCard: All extracted images",
                         "TechCard: Detected technologies",
                         "SEOCard: SEO audit with recommendations",
                         "ContentAnalysisCard: Article statistics",
                         "SocialCard: Open Graph and Twitter data",
                         "LinksCard: Internal and external links",
                         "FloatingExportButton: Export options"]),
                    createPageSection("7", "Settings Page", "/settings", "User account configuration and preferences.",
                        ["General: Theme toggle, export defaults",
                         "Billing: Subscription management",
                         "Account: Profile information editing",
                         "Notifications: Email preferences"]),
                    createPageSection("8", "Authentication Pages", "/login, /signup, /forgot-password", "User authentication and account management.",
                        ["Email/password login and registration",
                         "OAuth providers (Google, GitHub)",
                         "Password recovery flow",
                         "Session management"])
                ]
            },
            // PAGE 8: API ROUTES
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "7. API Routes", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Available Endpoints" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Endpoint", "Method", "Purpose"],
                        ["/api/health", "GET", "Health check for monitoring"],
                        ["/api/scrape", "POST", "Initiate a new scrape job"],
                        ["/api/scrape/content", "GET", "Retrieve scraped content by ID"],
                        ["/api/v2/scrape", "POST", "Enhanced scraping with mode selection"],
                        ["/api/v2/scrape/ai", "POST", "AI-powered data extraction"]
                    ]),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "API Request Example" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    new Paragraph({
                        shading: { fill: "1e1e1e" },
                        children: [new TextRun({ 
                            text: `POST /api/v2/scrape
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "url": "https://example.com",
  "mode": "full"
}`,
                            font: "Courier New",
                            color: "FFFFFF"
                        })]
                    }),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Response Format" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    new Paragraph({
                        shading: { fill: "1e1e1e" },
                        children: [new TextRun({ 
                            text: `{
  "id": "uuid-here",
  "status": "processing"
}`,
                            font: "Courier New",
                            color: "FFFFFF"
                        })]
                    })
                ]
            },
            // PAGE 9: DATABASE SCHEMA
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "8. Database Schema (Supabase)", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "websites Table" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Column", "Type", "Description"],
                        ["id", "uuid", "Primary key"],
                        ["user_id", "uuid", "Foreign key to auth.users"],
                        ["url", "text", "Scraped URL"],
                        ["status", "text", "pending, processing, completed, failed"],
                        ["created_at", "timestamp", "Creation time"],
                        ["completed_at", "timestamp", "Completion time"]
                    ]),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "metadata Table" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Column", "Type", "Description"],
                        ["id", "uuid", "Primary key"],
                        ["website_id", "uuid", "Foreign key to websites"],
                        ["title", "text", "Page title"],
                        ["description", "text", "Meta description"],
                        ["keywords", "text[]", "Meta keywords array"],
                        ["color_palette", "text[]", "Extracted colors"],
                        ["fonts", "text[]", "Extracted fonts"],
                        ["technologies", "text[]", "Detected technologies"]
                    ]),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "assets Table" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Column", "Type", "Description"],
                        ["id", "uuid", "Primary key"],
                        ["website_id", "uuid", "Foreign key to websites"],
                        ["file_type", "text", "image, css, js"],
                        ["url", "text", "Asset URL"]
                    ])
                ]
            },
            // PAGE 10: KEY COMPONENTS
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "9. Key Components", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Layout Components" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Component", "Purpose"],
                        ["Sidebar", "Navigation sidebar with all page links"],
                        ["Header", "Page header with title, URL, and actions"],
                        ["DynamicBackground", "Animated gradient backgrounds"],
                        ["MotionProvider", "Framer Motion provider wrapper"]
                    ]),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Card Components (13 total)" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["Component", "Displays"],
                        ["MetadataCard", "Page title, description, favicon, keywords"],
                        ["ColorPaletteCard", "Extracted color palette with hex codes"],
                        ["FontsCard", "Detected fonts with preview"],
                        ["ImageGalleryCard", "Grid gallery of all images"],
                        ["TechCard", "Detected technologies and frameworks"],
                        ["SEOCard", "SEO audit with recommendations"],
                        ["SocialCard", "Open Graph and Twitter Card data"],
                        ["ContentAnalysisCard", "Word count, reading time, headings"],
                        ["LinkedInCard", "LinkedIn profile extraction"],
                        ["InsightsCard", "Design intelligence scores"],
                        ["LinksCard", "Internal and external links"],
                        ["AssetsCard", "CSS and JS file listings"],
                        ["RawHTMLCard", "Full HTML source viewer"]
                    ]),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Core Libraries" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    createTable([
                        ["File", "Purpose"],
                        ["scraper.ts", "Main scraping engine with hybrid mode support"],
                        ["supabase.ts", "Database client and admin client"],
                        ["cache.ts", "In-memory caching layer"],
                        ["rateLimiter.ts", "Request rate limiting logic"],
                        ["queue.ts", "Background job queue system"],
                        ["logger.ts", "Structured logging utility"]
                    ])
                ]
            },
            // PAGE 11: ENVIRONMENT VARIABLES & GETTING STARTED
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "10. Environment Variables", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Required Variables" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    new Paragraph({
                        shading: { fill: "f5f5f5" },
                        children: [new TextRun({ 
                            text: `# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI (for AI extraction)
GOOGLE_AI_KEY=your_google_ai_key

# Browser (for Puppeteer)
BROWSER_WS_ENDPOINT=your_browser_endpoint  # Optional
CHROME_EXECUTABLE_PATH=/path/to/chrome     # Optional`,
                            font: "Courier New",
                            size: 20
                        })]
                    }),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "11. Getting Started", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Installation" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    new Paragraph({
                        shading: { fill: "f5f5f5" },
                        children: [new TextRun({ 
                            text: `# Clone the repository
git clone https://github.com/yourusername/webscrapex.git
cd webscrapex

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials`,
                            font: "Courier New",
                            size: 20
                        })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Development" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    new Paragraph({
                        shading: { fill: "f5f5f5" },
                        children: [new TextRun({ 
                            text: `# Start development server
npm run dev

# Open http://localhost:3000`,
                            font: "Courier New",
                            size: 20
                        })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: "Production" })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    new Paragraph({
                        shading: { fill: "f5f5f5" },
                        children: [new TextRun({ 
                            text: `# Build for production
npm run build

# Start production server
npm run start:prod`,
                            font: "Courier New",
                            size: 20
                        })]
                    })
                ]
            },
            // CONCLUSION
            {
                properties: {},
                children: [
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        children: [new TextRun({ text: "12. Conclusion", color: "7c3aed" })]
                    }),
                    new Paragraph({ spacing: { before: 300 } }),
                    new Paragraph({
                        children: [new TextRun({ 
                            text: "WebScrapeX is a comprehensive web scraping and design intelligence platform built with modern technologies. The project demonstrates proficiency in:"
                        })]
                    }),
                    new Paragraph({ spacing: { before: 200 } }),
                    ...[
                        "Full-stack TypeScript development with Next.js",
                        "Modern React patterns including hooks, context, and server components",
                        "Database design and management with Supabase/PostgreSQL",
                        "Web scraping with Cheerio and Puppeteer",
                        "AI integration with Google Gemini for natural language processing",
                        "Responsive design with Tailwind CSS and Framer Motion animations",
                        "Authentication and authorization with OAuth and email/password",
                        "Production deployment and optimization for Vercel/Netlify"
                    ].map(item => new Paragraph({
                        spacing: { before: 100 },
                        children: [new TextRun({ text: `• ${item}` })]
                    })),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 500 },
                        children: [
                            new TextRun({ text: "Thank you for reviewing this project.", italics: true, size: 24 })
                        ]
                    }),
                    new Paragraph({ spacing: { before: 400 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: `© ${new Date().getFullYear()} WebScrapeX Team`, size: 20, color: "666666" })
                        ]
                    })
                ]
            }
        ]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(OUTPUT_FILE, buffer);
    console.log('\n✅ Word Document generated successfully!');
    console.log(`📄 Location: ${OUTPUT_FILE}`);
}

function createTable(rows) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map((row, index) => new TableRow({
            children: row.map(cell => new TableCell({
                shading: index === 0 ? { fill: "7c3aed" } : { fill: index % 2 === 0 ? "f8f9fa" : "ffffff" },
                children: [new Paragraph({
                    children: [new TextRun({ 
                        text: cell, 
                        bold: index === 0,
                        color: index === 0 ? "ffffff" : "333333",
                        size: 20
                    })]
                })]
            }))
        }))
    });
}

function createPageSection(number, title, route, purpose, features) {
    return new Paragraph({
        spacing: { before: 300 },
        children: []
    });
}

module.exports = { generateDoc };

if (require.main === module) {
    generateDoc().catch(console.error);
}

generateDoc().catch(console.error);
