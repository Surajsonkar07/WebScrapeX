# Deployment Guide for WebScrapeX

This guide will help you deploy your WebScrapeX application to production using **Netlify** (recommended for this setup) and configure **Supabase** correctly.

## 1. Prerequisites

-   A [GitHub](https://github.com) account.
-   A [Netlify](https://netlify.com) account.
-   Your [Supabase](https://supabase.com) project URL and Anon Key.

## 2. Push Code to GitHub

1.  Initialize a git repository if you haven't already:
    ```bash
    git init
    git add .
    git commit -m "Ready for deploy"
    ```
2.  Create a new repository on GitHub.
3.  Push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git push -u origin main
    ```

## 3. Deploy to Netlify

1.  Log in to your [Netlify Dashboard](https://app.netlify.com/).
2.  Click **"Add new site"** -> **"Import an existing project"**.
3.  Select **GitHub**.
4.  Authorize Netlify and choose your `web-scrape-x` repository.
5.  **Build Settings:**
    *   **Base directory:** `(leave empty)`
    *   **Build command:** `npm run build`
    *   **Publish directory:** `.next`
    *   *(Note: The `netlify.toml` file in your project should auto-fill these for you).*
6.  **Environment Variables (CRITICAL):**
    Click on **"Add environment variables"** and add the keys from your local `.env.local` file:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7.  Click **"Deploy web-scrape-x"**.

## 4. Configure Supabase for Production

**Crucial Step:** Your authentication will fail if you skip this!

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Navigate to **Authentication** -> **URL Configuration**.
4.  **Site URL**: Set this to your Netlify domain (e.g., `https://your-site-name.netlify.app`).
5.  **Redirect URLs**: Add the following:
    *   `https://your-site-name.netlify.app/**`
    *   `https://your-site-name.netlify.app/auth/callback`
    *   `https://your-site-name.netlify.app/`

## 5. Changing the App Name

If you want to change the application name from "WebScrapeX" to something else (e.g., "MyLocalScraper"), follow these steps:

### Update Metadata (Tab Title & SEO)
Edit `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  // Change the base URL to your production domain
  metadataBase: new URL('https://your-new-domain.com'), 
  title: {
    default: "Your New App Name", // <--- Change this
    template: "%s | Your New App Name" // <--- Change this
  },
  // ... update description and other fields as needed
}
```

### Update the Logo/Text in UI
1.  **Sidebar**: Edit `components/layout/Sidebar.tsx` and find the text "WebScrapeX" inside the `Logo Section`.
2.  **Mobile Navbar**: Edit `components/layout/Navbar.tsx` and find "WEBSCRAPEX".

## 6. Puppeteer on Netlify (Important Warning)

This project uses `puppeteer` for scraping. By default, Puppeteer tries to download a full version of Chrome, which is **too large** for Netlify's free serverless functions (limited to 50MB).

**If your scrape fails in production:**
1.  **Intermediate Fix**: The project is configured to try and exclude local chromium to save space, but it might still hit memory limits.
2.  **Recommended Fix**: For valid production scraping, consider using a dedicated scraping API (like Browserless.io or BrightData) and calling it from your API route, OR deploy the API backend to a service that supports Docker containers (like Railway or Render) where size limits are higher.
