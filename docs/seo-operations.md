# SEO Operations Runbook

This document explains how to keep the SEO setup healthy after the code changes already added to the project.

## What Is Already In Place

- Shared SEO metadata handling in the frontend
- Canonical URLs, Open Graph, Twitter metadata, and JSON-LD schema
- A sitemap feed in the backend for blogs, articles, and menu pages
- A frontend sitemap generator script
- GitHub Actions workflows for SEO checks and sitemap refresh

## GitHub Setup

Add this repository variable in GitHub:

- `SITEMAP_API_BASE`
  - Example: `https://api.ravidassiaabroad.com`
  - This should point to the backend base URL, not the frontend domain

The workflows added in `.github/workflows` do two different jobs:

- `seo-checks.yml`
  - Runs on pull requests and pushes to `main`
  - Installs dependencies
  - Validates backend syntax
  - Builds the frontend

- `refresh-sitemap.yml`
  - Runs manually or weekly
  - Uses the backend sitemap feed
  - Regenerates `ravabroad/public/sitemap.xml`
  - Commits the refreshed sitemap to `main` if content changed

## Local Commands

Frontend build:

```powershell
cd ravabroad
npm run build
```

Generate sitemap manually:

```powershell
cd ravabroad
$env:SITEMAP_API_BASE="https://api.ravidassiaabroad.com"
npm run generate:sitemap
```

## Google Search Console Checklist

1. Verify both:
   - `https://www.ravidassiaabroad.com`
   - the preferred production domain actually used by visitors
2. Submit:
   - `https://www.ravidassiaabroad.com/sitemap.xml`
3. Request indexing for:
   - homepage
   - blogs page
   - temples page
   - students page
   - top article pages
4. Check Coverage and Page Indexing reports for:
   - blocked pages
   - duplicate canonical issues
   - soft 404s
5. Check Enhancements / rich result eligibility over time

## Indexing Rules To Keep

These should stay `noindex,nofollow` unless business requirements change:

- auth pages
- forgot password
- admin pages
- profile/dashboard pages
- matrimony listing and profile detail pages

These should stay indexable:

- homepage
- blogs and blog details
- articles
- temples
- personalities
- students hub
- public informational pages

## Content Recommendations

To improve rankings over time, publish and expand pages around:

- Guru Ravidass Ji history
- Ravidassia teachings and Gurbani explanations
- temple and Sabha directories by country/city
- student guidance for Canada, UK, USA, and Europe
- community festival and event pages
- authoritative blog/news updates

## Good Ongoing Habits

- When new public routes are added, make sure they get SEO metadata
- When new content models are added, consider adding them to the sitemap feed
- Keep titles and descriptions human-readable, not stuffed with keywords
- Use real internal links between related pages
- Review Search Console monthly
