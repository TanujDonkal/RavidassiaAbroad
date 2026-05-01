# Business Directory and Monetization Pages

This feature adds four new public pages and a business-directory moderation workflow without changing the core app architecture.

## New Public Routes

- `/support-us`
- `/sponsor-advertise`
- `/business-directory`
- `/business-directory/:slug`
- `/submit-business`
- `/affiliate-disclosure`

## What Was Added

- Support page explaining the mission and support paths
- Sponsor / Advertise page for community sponsorship opportunities
- Business Directory MVP with:
  - public approved listings
  - public business detail pages
  - guest or logged-in business submission flow
  - admin review, edit, approve, reject, hide, feature, and verify controls
- Affiliate disclosure page
- Five seeded community/history articles in `static_articles`

## Database

Use the SQL file below in production if you need a manual migration step:

- `backend/migrations/2026-04-26-businesses.sql`

The app also creates the `businesses` table automatically during backend startup through `initDB()`.

## Local Setup

1. Start PostgreSQL and make sure the normal backend environment variables are set.
2. Optionally apply the SQL file manually:
   - `psql -d <database_name> -f backend/migrations/2026-04-26-businesses.sql`
3. Start the backend normally.
4. Start the frontend normally.

## Admin Workflow

1. A user submits a business through `/submit-business`.
2. The listing is saved as `pending`.
3. Admin opens `/admin` and goes to the `Businesses` tab.
4. Admin can:
   - search and filter listings
   - edit listing details
   - approve, reject, or hide
   - toggle featured
   - toggle verified
   - change listing type between `free`, `premium`, and `featured`
5. Only `approved` listings appear publicly and in sitemap/search results.

## Deployment Notes

- No secrets were added to frontend code.
- Business image uploads use the existing Cloudinary-backed upload pattern.
- Public business pages are included in the backend sitemap feed only when approved.
- Pending, rejected, and hidden listings stay out of public APIs and sitemap output.
