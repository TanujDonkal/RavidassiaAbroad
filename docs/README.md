# Ravidassia Abroad Developer Docs

This folder explains how the website works in simple language so a new developer can understand the flow quickly.

## Start Here

1. Read `architecture.md`
2. Read `auth-and-profile.md`
3. Read `content-system.md`
4. Read `community-forms.md`
5. Read `admin-dashboard.md`
6. Read `backend-data-flow.md`
7. Read `compliance/privacy-checklist.md`
8. Read `compliance/data-retention-policy.md`
9. Read `compliance/incident-response.md`
10. Read `seo-operations.md`

## What This Website Does

Ravidassia Abroad is a community website with two big sides:

- A public website for reading content, browsing temples, learning about personalities, and contacting the team
- A member/admin side for login, profile updates, SC/ST connection requests, matrimonial biodata, and content management

## Main Feature Areas

- Public pages: home, about, contact, blogs, temple directory, personalities, static pages
- User auth: sign up, sign in, Google login, forgot password, profile page
- Community forms: Connect SC/ST by country, matrimonial biodata, content request form
- Engagement: comments on blogs and articles, site-wide search
- Admin tools: users, blogs, categories, menus, personalities, temples, articles, recipients, SC/ST submissions, matrimonial submissions, content requests

## Tech Stack At A Glance

- Frontend: React + React Router + Bootstrap
- Backend: Express
- Database: PostgreSQL
- File/image hosting: Cloudinary
- Email: Resend and Nodemailer/Gmail
- Auth: JWT + Google Sign-In

## Important Source Folders

- `ravabroad/src`: React frontend
- `backend/index.js`: main Express API server
- `ravabroad/src/components/admin`: admin dashboard sections
- `ravabroad/src/pages`: route-level frontend pages
- `ravabroad/src/utils/api.js`: frontend API wrapper

## Important Note

These docs describe the current implementation in the codebase. In a few places the app still has placeholder or partially finished behavior, and those places are clearly called out in the docs.
