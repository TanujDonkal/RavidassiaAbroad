# Admin Dashboard

## Purpose

The admin dashboard is the control center for the website.

Main frontend file:

- `ravabroad/src/pages/AdminDashboard.jsx`

Main admin section components:

- `ravabroad/src/components/admin/AdminUsersSection.jsx`
- `ravabroad/src/components/admin/AdminScstSubmissionsSection.jsx`
- `ravabroad/src/components/admin/AdminMatrimonialSection.jsx`
- `ravabroad/src/components/admin/AdminBlogsSection.jsx`
- `ravabroad/src/components/admin/AdminCategoriesSection.jsx`
- `ravabroad/src/components/admin/AdminRecipientsSection.jsx`
- `ravabroad/src/components/admin/AdminContentRequestsSection.jsx`
- `ravabroad/src/components/admin/AdminPersonalitiesSection.jsx`
- `ravabroad/src/components/admin/AdminTemplesSection.jsx`
- `ravabroad/src/components/ArticleManager.jsx`

## Access

Frontend route:

- `/admin`

The page is wrapped in `ProtectedRoute`.

Backend admin APIs use:

- `requireAuth`
- `requireAdmin`

## How The Dashboard Loads Data

The dashboard is tab-based.

When the active tab changes, `AdminDashboard.jsx` fetches only the data needed for that tab, for example:

- users
- SC/ST submissions
- matrimonial submissions
- blogs
- categories
- menus
- temples
- recipients
- content requests

This keeps the page simpler than loading every admin dataset at once.

## Main Admin Features

### Users

Admins can:

- view users
- change user role
- delete users
- bulk delete users

### SC/ST Submissions

Admins can:

- view submission list
- open detail modal
- send onboarding reply with WhatsApp group link
- delete and bulk delete

### Matrimonial Submissions

Admins can:

- view biodata list
- open detail modal
- delete and bulk delete
- generate shareable visual cards

### Blogs

Admins can:

- create blog posts
- upload images
- edit posts
- delete and bulk delete

### Categories

Admins can:

- create categories
- edit categories
- delete and bulk delete

### Menus

Admins can:

- create menu items
- set path, parent, and position
- edit menus
- delete and bulk delete

This directly affects home quick links and dynamic route matching.

### Personalities

Admins can:

- create personality entries
- upload images
- edit
- delete
- bulk delete

### Temples

Admins can:

- create temple directory entries
- upload main image and gallery images
- mark featured temples
- edit order and metadata
- delete and bulk delete

### Articles

Admins can:

- create static long-form articles
- upload article image
- edit HTML content with CKEditor
- delete articles

### Recipients

Recipients are email addresses used for notifications.

Admins can:

- add recipient emails
- delete recipient emails
- bulk delete recipient records

### Content Requests

Admins can:

- review add/remove/report requests
- delete requests
- bulk delete requests

## Common UX Patterns Inside Admin

The admin dashboard reuses a few patterns often:

- lazy-loaded sections
- popup-based confirm dialogs
- popup-based success/error messages
- modal-based create/edit forms
- checkbox selection for bulk actions

## Developer Notes

- Most admin data refreshes are done by refetching after create/edit/delete
- A lot of admin behavior lives directly inside `AdminDashboard.jsx`, so this file is a key place to understand overall operations
