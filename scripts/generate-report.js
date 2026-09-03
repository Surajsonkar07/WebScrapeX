const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PAGES = [
    { url: 'http://localhost:3000', name: 'Home', description: 'Main dashboard page with URL input form for scraping websites. Features hero section with animated text, scrape mode selector (Full, Social, Content, Design), and displays recent scrape history.' },
    { url: 'http://localhost:3000/docs', name: 'Documentation', description: 'Comprehensive user guide with three tabs: User Guide (3-step process), Standard API (key management), and AI Extraction (natural language prompts for data extraction).' },
    { url: 'http://localhost:3000/collections', name: 'Collections', description: 'Archive page showing all previously scraped websites. Displays grid of history cards with thumbnails, titles, and deletion options. Requires authentication.' },
    { url: 'http://localhost:3000/api-access', name: 'API Access', description: 'Developer API integration page with API key management, proxy rotation settings, webhook configuration, and code examples for ActivePieces, cURL, and Node.js.' },
    { url: 'http://localhost:3000/settings', name: 'Settings', description: 'User settings page with tabs for General (theme/appearance), Billing (subscription management), Account (profile info), and Notifications (email preferences).' },
    { url: 'http://localhost:3000/ai-scraper', name: 'AI Scraper', description: 'AI-powered extraction page where users input URLs and natural language prompts to extract structured data without writing selectors or CSS.' },
    { url: 'http://localhost:3000/login', name: 'Login', description: 'Authentication page with email/password login form and social authentication options (Google, GitHub). Features animated background gradients.' },
    { url: 'http://localhost:3000/signup', name: 'Signup', description: 'User registration page with email/password signup form and social authentication. Includes link to login for existing users.' },
];

const OUTPUT_DIR = path.join(__dirname, '..', 'report-assets');
const REPORT_FILE = path.join(__dirname, '..', 'WebScrapeX_Project_Report.pdf');

async function waitForServer(url, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return true;
        } catch (e) {
            // Server not ready
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    return false;
}

async function takeScreenshot(browser, url, outputPath) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: outputPath, fullPage: true });
        console.log(`Screenshot saved: ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`Failed to screenshot ${url}: ${error.message}`);
        return false;
    } finally {
        await page.close();
    }
}

async function generatePDF(pages, screenshots) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Create HTML content for PDF
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>WebScrapeX Project Report</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #fff; }
            .cover { text-align: center; padding: 100px 50px; background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
            .cover h1 { font-size: 48px; margin-bottom: 20px; }
            .cover h2 { font-size: 24px; font-weight: normal; opacity: 0.9; }
            .cover .subtitle { margin-top: 30px; font-size: 16px; opacity: 0.8; }
            .page { page-break-after: always; padding: 40px; min-height: 100vh; }
            .page:last-child { page-break-after: auto; }
            .toc { background: #f8f9fa; padding: 40px; }
            .toc h2 { margin-bottom: 20px; color: #7c3aed; }
            .toc ul { list-style: none; }
            .toc li { padding: 10px 0; border-bottom: 1px solid #eee; }
            .toc a { text-decoration: none; color: #333; }
            .section { margin-bottom: 40px; }
            .section h2 { color: #7c3aed; margin-bottom: 15px; font-size: 28px; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
            .section h3 { color: #333; margin-bottom: 10px; font-size: 20px; }
            .description { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #7c3aed; }
            .screenshot { width: 100%; border: 1px solid #ddd; border-radius: 10px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .tech-stack { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
            .tech-item { background: #f8f9fa; padding: 15px; border-radius: 8px; }
            .tech-item h4 { color: #7c3aed; margin-bottom: 5px; }
            .features { list-style: none; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .features li { background: linear-gradient(135deg, #7c3aed10, #db277710); padding: 15px; border-radius: 8px; border-left: 3px solid #7c3aed; }
            .architecture { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .architecture pre { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
            .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="cover">
            <h1>WebScrapeX</h1>
            <h2>Design Intelligence Platform</h2>
            <p class="subtitle">Project Report for College Submission</p>
            <p class="subtitle">Generated: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="page toc">
            <h2>Table of Contents</h2>
            <ul>
                <li><a href="#overview">1. Project Overview</a></li>
                <li><a href="#tech-stack">2. Technology Stack</a></li>
                <li><a href="#features">3. Core Features</a></li>
                <li><a href="#architecture">4. System Architecture</a></li>
                ${pages.map((p, i) => `<li><a href="#page-${i + 1}">${i + 5}. ${p.name} Page</a></li>`).join('')}
            </ul>
        </div>

        <div class="page" id="overview">
            <div class="section">
                <h2>1. Project Overview</h2>
                <div class="description">
                    <p><strong>WebScrapeX</strong> is a modern, production-ready web scraping and design intelligence platform built with Next.js 16, TypeScript, and Supabase. It enables users to extract and analyze design systems from any website, including colors, fonts, images, technologies, and metadata.</p>
                </div>
                <h3>Project Objectives</h3>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Extract design elements (colors, fonts, images) from any website</li>
                    <li>Detect technologies and frameworks used by websites</li>
                    <li>Provide SEO analysis and content insights</li>
                    <li>Offer AI-powered natural language data extraction</li>
                    <li>Enable API access for developer integration</li>
                    <li>Store and organize scraped data in user collections</li>
                </ul>
            </div>
        </div>

        <div class="page" id="tech-stack">
            <div class="section">
                <h2>2. Technology Stack</h2>
                <div class="tech-stack">
                    <div class="tech-item">
                        <h4>Frontend</h4>
                        <p>Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion, Radix UI</p>
                    </div>
                    <div class="tech-item">
                        <h4>Backend</h4>
                        <p>Next.js API Routes, Supabase (PostgreSQL, Auth, Storage)</p>
                    </div>
                    <div class="tech-item">
                        <h4>Scraping Engine</h4>
                        <p>Cheerio (Fast Mode), Puppeteer (Deep Mode), Puppeteer Extra with Stealth Plugin</p>
                    </div>
                    <div class="tech-item">
                        <h4>AI Integration</h4>
                        <p>Google Generative AI (Gemini) for natural language extraction</p>
                    </div>
                    <div class="tech-item">
                        <h4>Authentication</h4>
                        <p>Supabase Auth with OAuth (Google, GitHub) and Email/Password</p>
                    </div>
                    <div class="tech-item">
                        <h4>Deployment</h4>
                        <p>Vercel / Netlify with serverless functions</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="page" id="features">
            <div class="section">
                <h2>3. Core Features</h2>
                <ul class="features">
                    <li><strong>Hybrid Scraping:</strong> Fast mode (Cheerio) + Deep mode (Puppeteer) for comprehensive extraction</li>
                    <li><strong>Multiple Extractors:</strong> Metadata, colors, fonts, technologies, social data, LinkedIn profiles</li>
                    <li><strong>AI Extraction:</strong> Natural language prompts for structured data extraction</li>
                    <li><strong>Background Processing:</strong> Queue system for non-blocking operations</li>
                    <li><strong>Intelligent Caching:</strong> In-memory caching for repeated requests</li>
                    <li><strong>Rate Limiting:</strong> Per-user rate limiting to prevent abuse</li>
                    <li><strong>SEO Analysis:</strong> Comprehensive SEO audit with recommendations</li>
                    <li><strong>Export Options:</strong> JSON, PDF, color guides, and asset downloads</li>
                </ul>
            </div>
        </div>

        <div class="page" id="architecture">
            <div class="section">
                <h2>4. System Architecture</h2>
                <div class="architecture">
                    <pre>
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Scraping      │
│   (Next.js)     │───▶│   (Next.js)     │───▶│   Engine        │
│                 │    │                 │    │   (Cheerio/     │
│                 │    │                 │    │    Puppeteer)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Caching       │    │   Rate Limiting │    │   Database      │
│   Layer         │    │                 │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                    </pre>
                </div>
                <h3>Data Flow</h3>
                <ol style="margin-left: 20px; margin-top: 10px;">
                    <li><strong>User Request:</strong> User submits URL via frontend</li>
                    <li><strong>Rate Check:</strong> System checks rate limits for user</li>
                    <li><strong>Cache Check:</strong> System checks if URL was recently scraped</li>
                    <li><strong>Queue Job:</strong> Scraping job added to queue (background processing)</li>
                    <li><strong>Scraping:</strong> Engine extracts data using appropriate mode</li>
                    <li><strong>Storage:</strong> Results saved to database and storage</li>
                    <li><strong>Response:</strong> Frontend polls for results and displays</li>
                </ol>
            </div>
        </div>

        ${pages.map((page, i) => `
        <div class="page" id="page-${i + 1}">
            <div class="section">
                <h2>${i + 5}. ${page.name} Page</h2>
                <div class="description">
                    <p><strong>URL:</strong> ${page.url}</p>
                    <p style="margin-top: 10px;">${page.description}</p>
                </div>
                <h3>Screenshot</h3>
                <img class="screenshot" src="${screenshots[i] || ''}" alt="${page.name} Screenshot" />
            </div>
        </div>
        `).join('')}

        <div class="footer">
            <p>WebScrapeX Project Report - Generated for College Submission</p>
            <p>© ${new Date().getFullYear()} WebScrapeX Team</p>
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    await page.pdf({
        path: REPORT_FILE,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    await browser.close();
    console.log(`\nPDF Report generated: ${REPORT_FILE}`);
}

async function main() {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('Starting development server...');
    const devServer = spawn('npm', ['run', 'dev'], {
        shell: true,
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
    });

    devServer.stdout.on('data', (data) => {
        console.log(`Server: ${data.toString().trim()}`);
    });

    devServer.stderr.on('data', (data) => {
        console.error(`Server Error: ${data.toString().trim()}`);
    });

    // Wait for server to start
    console.log('\nWaiting for server to start...');
    const serverReady = await waitForServer('http://localhost:3000');
    
    if (!serverReady) {
        console.error('Server failed to start. Exiting...');
        devServer.kill();
        process.exit(1);
    }
    
    console.log('Server is ready!\n');

    // Take screenshots
    console.log('Taking screenshots...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const screenshots = [];

    for (const pageInfo of PAGES) {
        const screenshotPath = path.join(OUTPUT_DIR, `${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`);
        const success = await takeScreenshot(browser, pageInfo.url, screenshotPath);
        if (success) {
            screenshots.push(screenshotPath);
        } else {
            screenshots.push(null);
        }
    }

    await browser.close();
    console.log('\nScreenshots complete!');

    // Generate PDF
    console.log('\nGenerating PDF report...');
    await generatePDF(PAGES, screenshots);

    // Cleanup
    devServer.kill();
    console.log('\nDone! Report saved to:', REPORT_FILE);
}

main().catch(console.error);
