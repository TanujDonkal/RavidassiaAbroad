# Backend Data Flow

## Main Backend File

- `backend/index.js`

This file is the heart of the server.

## Startup Responsibilities

When the server starts, it:

- loads environment variables
- configures CORS
- configures JSON/body limits
- configures Cloudinary
- creates PostgreSQL pool
- creates email clients
- initializes database tables
- starts listening on the configured port

## Important Middleware

### `requireAuth`

Used on routes that need a logged-in user.

What it checks:

- reads Bearer token from `Authorization` header
- verifies JWT
- attaches decoded user to `req.user`

### `requireAdmin`

Used on admin routes.

Allowed backend roles:

- `admin`
- `main_admin`
- `moderate_admin`

## Main Database Areas

The backend creates and uses tables for:

- `users`
- `scst_submissions`
- `matrimonial_submissions`
- `recipients`
- `content_requests`
- `blog_categories`
- `blog_posts`
- `blog_comments`
- `global_temples`
- `site_menus`
- `famous_personalities`
- `static_articles`

There are also related schema updates and helper queries inside the same file.

## Upload Flow

Images are uploaded through Cloudinary using Multer.

Shared pattern:

- frontend sends `FormData`
- backend uses Multer + Cloudinary storage
- Cloudinary returns hosted image URL
- backend stores URL in database

This is used for things like:

- blog images
- personality photos
- temple images
- matrimonial photos
- user profile photos

## Search Flow

Search is backend-driven.

The backend:

- builds static searchable pages
- scores results based on title, summary, meta text, and keywords
- combines content from multiple sources
- returns grouped-friendly results plus related keywords

This means search logic is centralized in the server, not spread across many frontend pages.

## Email / Notification Flow

The backend uses email tools in different places:

- auth/password reset
- SC/ST onboarding replies
- recipient-based notifications in admin-related flows

One important live flow is SC/ST reply:

- admin submits reply info
- backend creates formatted email content
- backend sends email
- backend also prepares a WhatsApp message link

## Data Design Pattern Used In The App

Most feature flows follow the same shape:

1. frontend loads current state from backend
2. user changes data in a form or admin modal
3. frontend submits JSON or `FormData`
4. backend validates and saves to PostgreSQL
5. frontend refreshes list/detail state

This pattern is repeated across blogs, categories, menus, personalities, temples, articles, and submissions.

## Seeded And Placeholder Areas

A few areas are more finished than others.

More structured data-driven areas:

- auth
- SC/ST submissions
- matrimonial submissions
- blogs
- categories
- temples
- personalities
- menus
- admin dashboard

More placeholder or semi-static areas:

- some public informational pages
- contact page mail submission
- dynamic menu pages that currently render generic placeholder content

## Good Files To Read After This

- `ravabroad/src/App.js`
- `ravabroad/src/components/Layout.jsx`
- `ravabroad/src/utils/api.js`
- `ravabroad/src/pages/AdminDashboard.jsx`
- `ravabroad/src/pages/connect-scst.jsx`
- `ravabroad/src/pages/MatrimonialForm.jsx`
