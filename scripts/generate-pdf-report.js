const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const REPORT_FILE = path.join(__dirname, '..', 'WebScrapeX_Project_Report.pdf');

async function generatePDF() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>WebScrapeX Project Report</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #fff; }
            
            .cover { 
                text-align: center; 
                padding: 100px 50px; 
                background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); 
                color: white; 
                min-height: 100vh; 
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                page-break-after: always;
            }
            .cover h1 { font-size: 56px; margin-bottom: 20px; letter-spacing: -2px; }
            .cover h2 { font-size: 28px; font-weight: normal; opacity: 0.9; margin-bottom: 10px; }
            .cover .subtitle { margin-top: 40px; font-size: 16px; opacity: 0.8; }
            .cover .tech { margin-top: 60px; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
            .cover .tech span { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; }
            
            .page { page-break-after: always; padding: 50px; min-height: 100vh; }
            .page:last-child { page-break-after: auto; }
            
            .toc { background: #f8f9fa; padding: 50px; }
            .toc h2 { margin-bottom: 30px; color: #7c3aed; font-size: 32px; border-bottom: 3px solid #7c3aed; padding-bottom: 15px; }
            .toc ul { list-style: none; }
            .toc li { padding: 12px 0; border-bottom: 1px solid #eee; font-size: 16px; }
            .toc a { text-decoration: none; color: #333; }
            .toc a:hover { color: #7c3aed; }
            
            .section { margin-bottom: 40px; }
            .section h2 { color: #7c3aed; margin-bottom: 20px; font-size: 28px; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
            .section h3 { color: #333; margin: 25px 0 15px 0; font-size: 22px; }
            .section h4 { color: #555; margin: 20px 0 10px 0; font-size: 18px; }
            
            .description { background: linear-gradient(135deg, #f8f9fa, #fff); padding: 25px; border-radius: 15px; margin: 20px 0; border-left: 5px solid #7c3aed; }
            .description p { margin-bottom: 10px; }
            
            .tech-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 25px 0; }
            .tech-item { background: #f8f9fa; padding: 20px; border-radius: 12px; border-left: 4px solid #7c3aed; }
            .tech-item h4 { color: #7c3aed; margin-bottom: 8px; font-size: 16px; }
            .tech-item p { font-size: 14px; color: #666; }
            
            .feature-list { list-style: none; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .feature-list li { background: linear-gradient(135deg, #7c3aed10, #db277710); padding: 18px; border-radius: 12px; border-left: 4px solid #7c3aed; font-size: 14px; }
            .feature-list li strong { display: block; margin-bottom: 5px; color: #7c3aed; }
            
            .page-card { background: #f8f9fa; padding: 25px; border-radius: 15px; margin: 25px 0; border: 2px solid #eee; }
            .page-card h3 { color: #7c3aed; margin-bottom: 15px; font-size: 22px; display: flex; align-items: center; gap: 10px; }
            .page-card .number { background: #7c3aed; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
            .page-card .url { background: #7c3aed20; padding: 8px 15px; border-radius: 20px; font-family: monospace; font-size: 13px; color: #7c3aed; display: inline-block; margin-bottom: 15px; }
            .page-card ul { margin-left: 20px; margin-top: 10px; }
            .page-card li { margin-bottom: 8px; font-size: 14px; }
            
            .architecture { background: #1e1e1e; padding: 30px; border-radius: 15px; margin: 25px 0; overflow-x: auto; }
            .architecture pre { color: #d4d4d4; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.5; white-space: pre; }
            
            .flow-list { margin-left: 25px; }
            .flow-list li { margin-bottom: 12px; position: relative; padding-left: 30px; }
            .flow-list li:before { content: counter(step); counter-increment: step; position: absolute; left: 0; top: 0; background: #7c3aed; color: white; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: bold; }
            .flow-list { counter-reset: step; list-style: none; }
            
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
            th { background: #7c3aed; color: white; padding: 12px 15px; text-align: left; }
            td { padding: 12px 15px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background: #f8f9fa; }
            
            .footer { text-align: center; padding: 40px; background: linear-gradient(135deg, #7c3aed, #db2777); color: white; }
            .footer p { margin-bottom: 5px; }
            
            code { background: #f1f1f1; padding: 2px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; color: #7c3aed; }
            
            .highlight { background: linear-gradient(135deg, #7c3aed, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        </style>
    </head>
    <body>
        <!-- COVER PAGE -->
        <div class="cover">
            <h1>WebScrapeX</h1>
            <h2>Design Intelligence Platform</h2>
            <p style="font-size: 18px; opacity: 0.8; margin-top: 10px;">Web Scraping & Analysis Application</p>
            <p class="subtitle">Project Report for College Submission</p>
            <p class="subtitle">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <div class="tech">
                <span>Next.js 16</span>
                <span>React 19</span>
                <span>TypeScript</span>
                <span>Supabase</span>
                <span>Puppeteer</span>
                <span>Google AI</span>
            </div>
        </div>

        <!-- TABLE OF CONTENTS -->
        <div class="page toc">
            <h2>Table of Contents</h2>
            <ul>
                <li>1. Project Overview</li>
                <li>2. Technology Stack</li>
                <li>3. Project Structure</li>
                <li>4. Core Features</li>
                <li>5. System Architecture</li>
                <li>6. Pages & Functionality</li>
                <li>7. API Routes</li>
                <li>8. Database Schema</li>
                <li>9. Key Components</li>
                <li>10. Conclusion</li>
            </ul>
        </div>

        <!-- PAGE 1: PROJECT OVERVIEW -->
        <div class="page">
            <div class="section">
                <h2>1. Project Overview</h2>
                
                <div class="description">
                    <p><strong>WebScrapeX</strong> is a modern, production-ready web scraping and design intelligence platform built with Next.js 16, TypeScript, and Supabase. It enables users to extract and analyze design systems from any website, including colors, fonts, images, technologies, and metadata.</p>
                </div>
                
                <h3>Project Objectives</h3>
                <ul style="margin-left: 25px; margin-top: 15px;">
                    <li>Extract design elements (colors, fonts, images) from any website</li>
                    <li>Detect technologies and frameworks used by websites</li>
                    <li>Provide SEO analysis and content insights</li>
                    <li>Offer AI-powered natural language data extraction</li>
                    <li>Enable API access for developer integration</li>
                    <li>Store and organize scraped data in user collections</li>
                </ul>
                
                <h3 style="margin-top: 30px;">Key Statistics</h3>
                <table>
                    <tr><th>Metric</th><th>Value</th></tr>
                    <tr><td>Framework</td><td>Next.js 16.1.1 (App Router)</td></tr>
                    <tr><td>Language</td><td>TypeScript 5</td></tr>
                    <tr><td>Total Pages</td><td>11 Pages</td></tr>
                    <tr><td>Components</td><td>40+ Components</td></tr>
                    <tr><td>API Routes</td><td>10+ Endpoints</td></tr>
                    <tr><td>Dependencies</td><td>75+ Packages</td></tr>
                </table>
            </div>
        </div>

        <!-- PAGE 2: TECHNOLOGY STACK -->
        <div class="page">
            <div class="section">
                <h2>2. Technology Stack</h2>
                
                <h3>Frontend Technologies</h3>
                <div class="tech-grid">
                    <div class="tech-item">
                        <h4>Next.js 16</h4>
                        <p>React framework with App Router for SSR, API routes, and file-based routing</p>
                    </div>
                    <div class="tech-item">
                        <h4>React 19</h4>
                        <p>UI library for building interactive components with hooks and context</p>
                    </div>
                    <div class="tech-item">
                        <h4>TypeScript 5</h4>
                        <p>Type-safe JavaScript for better code quality and developer experience</p>
                    </div>
                    <div class="tech-item">
                        <h4>Tailwind CSS 3.4</h4>
                        <p>Utility-first CSS framework for rapid, responsive UI development</p>
                    </div>
                    <div class="tech-item">
                        <h4>Framer Motion 12</h4>
                        <p>Animation library for smooth transitions and micro-interactions</p>
                    </div>
                    <div class="tech-item">
                        <h4>Radix UI</h4>
                        <p>Accessible, unstyled UI components (Dialog, Tabs, Dropdown, etc.)</p>
                    </div>
                </div>
                
                <h3>Backend Technologies</h3>
                <div class="tech-grid">
                    <div class="tech-item">
                        <h4>Supabase</h4>
                        <p>PostgreSQL database, authentication, real-time subscriptions, and file storage</p>
                    </div>
                    <div class="tech-item">
                        <h4>Cheerio 1.1</h4>
                        <p>Fast HTML parser for static content extraction (Fast Mode scraping)</p>
                    </div>
                    <div class="tech-item">
                        <h4>Puppeteer 22</h4>
                        <p>Headless Chrome for dynamic content, screenshots, and PDF generation</p>
                    </div>
                    <div class="tech-item">
                        <h4>Google Generative AI</h4>
                        <p>AI integration for natural language data extraction with Gemini</p>
                    </div>
                    <div class="tech-item">
                        <h4>Puppeteer Extra + Stealth</h4>
                        <p>Bypasses bot detection for reliable scraping of protected sites</p>
                    </div>
                    <div class="tech-item">
                        <h4>Mozilla Readability</h4>
                        <p>Content extraction engine for clean article parsing</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- PAGE 3: PROJECT STRUCTURE -->
        <div class="page">
            <div class="section">
                <h2>3. Project Structure</h2>
                
                <div class="description">
                    <p>The project follows Next.js 16 App Router conventions with a clean separation of concerns between pages, components, and core libraries.</p>
                </div>
                
                <h3>Directory Overview</h3>
                <table>
                    <tr><th>Directory</th><th>Purpose</th></tr>
                    <tr><td><code>app/</code></td><td>Next.js App Router pages and API routes</td></tr>
                    <tr><td><code>components/</code></td><td>Reusable React components (40+ components)</td></tr>
                    <tr><td><code>lib/</code></td><td>Core libraries (scraper, database, utilities)</td></tr>
                    <tr><td><code>hooks/</code></td><td>Custom React hooks (useAuth, useResponsive, etc.)</td></tr>
                    <tr><td><code>scripts/</code></td><td>Utility scripts (queue worker, cleanup)</td></tr>
                    <tr><td><code>public/</code></td><td>Static assets and PWA files</td></tr>
                </table>
                
                <h3>App Directory Structure</h3>
                <table>
                    <tr><th>Path</th><th>Description</th></tr>
                    <tr><td><code>app/page.tsx</code></td><td>Home/Landing page</td></tr>
                    <tr><td><code>app/layout.tsx</code></td><td>Root layout with providers</td></tr>
                    <tr><td><code>app/api/</code></td><td>API route handlers</td></tr>
                    <tr><td><code>app/result/[id]/</code></td><td>Dynamic result pages</td></tr>
                    <tr><td><code>app/docs/</code></td><td>Documentation page</td></tr>
                    <tr><td><code>app/collections/</code></td><td>User's scrape history</td></tr>
                    <tr><td><code>app/ai-scraper/</code></td><td>AI-powered extraction</td></tr>
                    <tr><td><code>app/login/</code></td><td>Authentication pages</td></tr>
                </table>
            </div>
        </div>

        <!-- PAGE 4: CORE FEATURES -->
        <div class="page">
            <div class="section">
                <h2>4. Core Features</h2>
                
                <ul class="feature-list">
                    <li><strong>Hybrid Scraping</strong> Fast mode (Cheerio) + Deep mode (Puppeteer) for comprehensive extraction</li>
                    <li><strong>Multiple Extractors</strong> Metadata, colors, fonts, technologies, social data, LinkedIn profiles</li>
                    <li><strong>AI Extraction</strong> Natural language prompts for structured data extraction without selectors</li>
                    <li><strong>Background Processing</strong> Queue system for non-blocking operations with real-time updates</li>
                    <li><strong>Intelligent Caching</strong> In-memory caching for repeated requests and faster response times</li>
                    <li><strong>Rate Limiting</strong> Per-user request limits to prevent abuse (100 req/min)</li>
                    <li><strong>SEO Analysis</strong> Comprehensive SEO audit with actionable recommendations</li>
                    <li><strong>Export Options</strong> JSON, PDF, color guides, and asset downloads</li>
                    <li><strong>Screenshot & PDF</strong> Full-page screenshots and PDF snapshots of scraped pages</li>
                    <li><strong>OAuth Authentication</strong> Google and GitHub login with email/password support</li>
                </ul>
                
                <h3>Scraping Modes</h3>
                <table>
                    <tr><th>Mode</th><th>Speed</th><th>Data Extracted</th></tr>
                    <tr><td><strong>Full</strong></td><td>~30-60s</td><td>Everything: colors, fonts, images, tech, metadata, SEO</td></tr>
                    <tr><td><strong>Social</strong></td><td>~5-10s</td><td>Open Graph, Twitter Cards, social metadata</td></tr>
                    <tr><td><strong>Content</strong></td><td>~10-15s</td><td>Article content, readability analysis, headings</td></tr>
                    <tr><td><strong>Design</strong></td><td>~20-30s</td><td>Colors, fonts, images, CSS files</td></tr>
                </table>
            </div>
        </div>

        <!-- PAGE 5: SYSTEM ARCHITECTURE -->
        <div class="page">
            <div class="section">
                <h2>5. System Architecture</h2>
                
                <div class="architecture">
                    <pre>
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │   Frontend      │      │   API Routes    │      │   Scraping      │
  │   (Next.js)     │─────▶│   (Next.js)     │─────▶│   Engine        │
  │   React + TS    │      │   REST API      │      │   Cheerio +     │
  │   Tailwind CSS  │      │   Authentication│      │   Puppeteer     │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
           │                        │                        │
           │                        │                        │
           ▼                        ▼                        ▼
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │   Caching       │      │   Rate Limiting │      │   Database      │
  │   Layer         │      │   Queue System  │      │   Supabase      │
  │   In-Memory     │      │   100 req/min   │      │   PostgreSQL    │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────┐
                                                    │   Storage       │
                                                    │   Screenshots   │
                                                    │   PDFs, Assets  │
                                                    └─────────────────┘</pre>
                </div>
                
                <h3>Data Flow</h3>
                <ol class="flow-list">
                    <li><strong>User Request:</strong> User submits URL via the web interface</li>
                    <li><strong>Authentication:</strong> System validates user session and permissions</li>
                    <li><strong>Rate Check:</strong> Ensures user hasn't exceeded rate limits</li>
                    <li><strong>Cache Check:</strong> Returns cached result if URL was recently scraped</li>
                    <li><strong>Queue Job:</strong> Scraping job added to background queue</li>
                    <li><strong>Scraping:</strong> Engine extracts data using appropriate mode</li>
                    <li><strong>Processing:</strong> Colors, fonts, technologies extracted and processed</li>
                    <li><strong>Storage:</strong> Results saved to database and assets to storage</li>
                    <li><strong>Response:</strong> Frontend polls for results and displays</li>
                </ol>
            </div>
        </div>

        <!-- PAGE 6-7: PAGES & FUNCTIONALITY -->
        <div class="page">
            <div class="section">
                <h2>6. Pages & Functionality</h2>
                
                <div class="page-card">
                    <h3><span class="number">1</span> Home Page</h3>
                    <div class="url">Route: /</div>
                    <p><strong>Purpose:</strong> Main dashboard and landing page for the application.</p>
                    <ul>
                        <li>Hero section with animated text reveal</li>
                        <li>URL input form for initiating scrapes</li>
                        <li>Scrape mode selector (Full, Social, Content, Design)</li>
                        <li>Feature showcase cards</li>
                        <li>User's recent scrape history</li>
                        <li>Analytics dashboard for logged-in users</li>
                    </ul>
                </div>
                
                <div class="page-card">
                    <h3><span class="number">2</span> Documentation Page</h3>
                    <div class="url">Route: /docs</div>
                    <p><strong>Purpose:</strong> Comprehensive user guide and API documentation.</p>
                    <ul>
                        <li>User Guide: 3-step process (Input → Analyze → Export)</li>
                        <li>Standard API: Authentication and key management</li>
                        <li>AI Extraction: Natural language prompt documentation</li>
                    </ul>
                </div>
                
                <div class="page-card">
                    <h3><span class="number">3</span> Collections Page</h3>
                    <div class="url">Route: /collections</div>
                    <p><strong>Purpose:</strong> Archive of all previously scraped websites.</p>
                    <ul>
                        <li>Grid display of history cards</li>
                        <li>Website thumbnails, titles, and dates</li>
                        <li>Delete functionality</li>
                        <li>Requires authentication</li>
                    </ul>
                </div>
                
                <div class="page-card">
                    <h3><span class="number">4</span> API Access Page</h3>
                    <div class="url">Route: /api-access</div>
                    <p><strong>Purpose:</strong> Developer API integration and key management.</p>
                    <ul>
                        <li>API key reveal/regenerate/copy</li>
                        <li>Proxy rotation settings</li>
                        <li>Webhook configuration</li>
                        <li>Code examples (cURL, Node.js, ActivePieces)</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="page">
            <div class="section">
                <div class="page-card">
                    <h3><span class="number">5</span> AI Scraper Page</h3>
                    <div class="url">Route: /ai-scraper</div>
                    <p><strong>Purpose:</strong> AI-powered natural language data extraction.</p>
                    <ul>
                        <li>URL input for target website</li>
                        <li>Natural language prompt textarea</li>
                        <li>JSON output with syntax highlighting</li>
                        <li>No CSS selectors required</li>
                    </ul>
                </div>
                
                <div class="page-card">
                    <h3><span class="number">6</span> Result Page</h3>
                    <div class="url">Route: /result/[id]</div>
                    <p><strong>Purpose:</strong> Display detailed scrape results with multiple cards.</p>
                    <ul>
                        <li>MetadataCard: Title, description, keywords</li>
                        <li>ColorPaletteCard: Extracted colors</li>
                        <li>FontsCard: Detected fonts</li>
                        <li>ImageGalleryCard: All images</li>
                        <li>TechCard: Technologies detected</li>
                        <li>SEOCard: SEO audit results</li>
                        <li>ContentAnalysisCard: Article analysis</li>
                        <li>SocialCard: Open Graph data</li>
                        <li>LinksCard: Internal/external links</li>
                        <li>FloatingExportButton: Export options</li>
                    </ul>
                </div>
                
                <div class="page-card">
                    <h3><span class="number">7</span> Settings Page</h3>
                    <div class="url">Route: /settings</div>
                    <p><strong>Purpose:</strong> User account configuration and preferences.</p>
                    <ul>
                        <li>General: Theme toggle, export defaults</li>
                        <li>Billing: Subscription management</li>
                        <li>Account: Profile information</li>
                        <li>Notifications: Email preferences</li>
                    </ul>
                </div>
                
                <div class="page-card">
                    <h3><span class="number">8</span> Authentication Pages</h3>
                    <div class="url">Routes: /login, /signup, /forgot-password</div>
                    <p><strong>Purpose:</strong> User authentication and account management.</p>
                    <ul>
                        <li>Email/password login and registration</li>
                        <li>OAuth providers (Google, GitHub)</li>
                        <li>Password recovery</li>
                        <li>Session management</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- PAGE 8: API ROUTES -->
        <div class="page">
            <div class="section">
                <h2>7. API Routes</h2>
                
                <table>
                    <tr><th>Endpoint</th><th>Method</th><th>Purpose</th></tr>
                    <tr><td><code>/api/health</code></td><td>GET</td><td>Health check for monitoring</td></tr>
                    <tr><td><code>/api/scrape</code></td><td>POST</td><td>Initiate a new scrape job</td></tr>
                    <tr><td><code>/api/scrape/content</code></td><td>GET</td><td>Retrieve scraped content by ID</td></tr>
                    <tr><td><code>/api/v2/scrape</code></td><td>POST</td><td>Enhanced scraping with mode selection</td></tr>
                    <tr><td><code>/api/v2/scrape/ai</code></td><td>POST</td><td>AI-powered data extraction</td></tr>
                </table>
                
                <h3>API Request Example</h3>
                <div class="description">
                    <pre style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 10px; overflow-x: auto; font-size: 12px;">
POST /api/v2/scrape
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "url": "https://example.com",
  "mode": "full"
}

Response:
{
  "id": "uuid-here",
  "status": "processing"
}</pre>
                </div>
                
                <h3>AI Extraction Example</h3>
                <div class="description">
                    <pre style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 10px; overflow-x: auto; font-size: 12px;">
POST /api/v2/scrape/ai
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "url": "https://store.example.com/products",
  "prompt": "Extract all product names, prices, and ratings"
}</pre>
                </div>
            </div>
        </div>

        <!-- PAGE 9: DATABASE SCHEMA -->
        <div class="page">
            <div class="section">
                <h2>8. Database Schema (Supabase)</h2>
                
                <h3>websites Table</h3>
                <table>
                    <tr><th>Column</th><th>Type</th><th>Description</th></tr>
                    <tr><td>id</td><td>uuid</td><td>Primary key</td></tr>
                    <tr><td>user_id</td><td>uuid</td><td>Foreign key to auth.users</td></tr>
                    <tr><td>url</td><td>text</td><td>Scraped URL</td></tr>
                    <tr><td>status</td><td>text</td><td>pending, processing, completed, failed</td></tr>
                    <tr><td>created_at</td><td>timestamp</td><td>Creation time</td></tr>
                    <tr><td>completed_at</td><td>timestamp</td><td>Completion time</td></tr>
                </table>
                
                <h3>metadata Table</h3>
                <table>
                    <tr><th>Column</th><th>Type</th><th>Description</th></tr>
                    <tr><td>id</td><td>uuid</td><td>Primary key</td></tr>
                    <tr><td>website_id</td><td>uuid</td><td>Foreign key to websites</td></tr>
                    <tr><td>title</td><td>text</td><td>Page title</td></tr>
                    <tr><td>description</td><td>text</td><td>Meta description</td></tr>
                    <tr><td>keywords</td><td>text[]</td><td>Meta keywords array</td></tr>
                    <tr><td>color_palette</td><td>text[]</td><td>Extracted colors</td></tr>
                    <tr><td>fonts</td><td>text[]</td><td>Extracted fonts</td></tr>
                    <tr><td>technologies</td><td>text[]</td><td>Detected tech stack</td></tr>
                </table>
                
                <h3>assets Table</h3>
                <table>
                    <tr><th>Column</th><th>Type</th><th>Description</th></tr>
                    <tr><td>id</td><td>uuid</td><td>Primary key</td></tr>
                    <tr><td>website_id</td><td>uuid</td><td>Foreign key to websites</td></tr>
                    <tr><td>file_type</td><td>text</td><td>image, css, js</td></tr>
                    <tr><td>url</td><td>text</td><td>Asset URL</td></tr>
                </table>
            </div>
        </div>

        <!-- PAGE 10: KEY COMPONENTS -->
        <div class="page">
            <div class="section">
                <h2>9. Key Components</h2>
                
                <h3>Layout Components</h3>
                <table>
                    <tr><th>Component</th><th>Purpose</th></tr>
                    <tr><td>Sidebar</td><td>Navigation sidebar with all page links</td></tr>
                    <tr><td>Header</td><td>Page header with title, URL, and actions</td></tr>
                    <tr><td>DynamicBackground</td><td>Animated gradient backgrounds</td></tr>
                </table>
                
                <h3>Card Components (13 total)</h3>
                <table>
                    <tr><th>Component</th><th>Displays</th></tr>
                    <tr><td>MetadataCard</td><td>Page title, description, favicon, keywords</td></tr>
                    <tr><td>ColorPaletteCard</td><td>Extracted color palette with hex codes</td></tr>
                    <tr><td>FontsCard</td><td>Detected fonts with preview</td></tr>
                    <tr><td>ImageGalleryCard</td><td>Grid gallery of all images</td></tr>
                    <tr><td>TechCard</td><td>Detected technologies and frameworks</td></tr>
                    <tr><td>SEOCard</td><td>SEO audit with recommendations</td></tr>
                    <tr><td>SocialCard</td><td>Open Graph and Twitter Card data</td></tr>
                    <tr><td>ContentAnalysisCard</td><td>Word count, reading time, headings</td></tr>
                    <tr><td>LinkedInCard</td><td>LinkedIn profile extraction</td></tr>
                    <tr><td>InsightsCard</td><td>Design intelligence scores</td></tr>
                    <tr><td>LinksCard</td><td>Internal and external links</td></tr>
                    <tr><td>AssetsCard</td><td>CSS and JS file listings</td></tr>
                    <tr><td>RawHTMLCard</td><td>Full HTML source viewer</td></tr>
                </table>
                
                <h3>Core Libraries (lib/)</h3>
                <table>
                    <tr><th>File</th><th>Purpose</th></tr>
                    <tr><td>scraper.ts</td><td>Main scraping engine with hybrid mode support</td></tr>
                    <tr><td>supabase.ts</td><td>Database client and admin client</td></tr>
                    <tr><td>cache.ts</td><td>In-memory caching layer</td></tr>
                    <tr><td>rateLimiter.ts</td><td>Request rate limiting logic</td></tr>
                    <tr><td>queue.ts</td><td>Background job queue system</td></tr>
                    <tr><td>logger.ts</td><td>Structured logging utility</td></tr>
                    <tr><td>retry.ts</td><td>Exponential backoff retry logic</td></tr>
                </table>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <h2 style="font-size: 24px; margin-bottom: 20px;">WebScrapeX Project Report</h2>
            <p>College Project Submission</p>
            <p style="opacity: 0.8; margin-top: 10px;">Built with Next.js 16, React 19, TypeScript, and Supabase</p>
            <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">© ${new Date().getFullYear()} WebScrapeX Team</p>
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    await page.pdf({
        path: REPORT_FILE,
        format: 'A4',
        printBackground: true,
        margin: { top: '15px', right: '15px', bottom: '15px', left: '15px' }
    });
    
    await browser.close();
    console.log('\n✅ PDF Report generated successfully!');
    console.log(`📄 Location: ${REPORT_FILE}`);
}

generatePDF().catch(console.error);
