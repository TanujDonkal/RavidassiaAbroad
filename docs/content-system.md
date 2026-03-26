# Content System

## What This Feature Covers

- Home page content flow
- Blogs and categories
- Static articles
- Comments
- Site search
- Dynamic menus and placeholder pages
- Personalities
- Global temples directory
- Contact and content requests

## Home Page

Main file:

- `ravabroad/src/pages/Home.jsx`

What happens here:

- Loads dynamic menus from `/api/menus`
- Shows a hero carousel
- Renders a quick-links bar from menu data
- Shows mostly curated static sections for community messaging

If no menus exist in the database, the home page falls back to hardcoded links.

## Blogs And Categories

Main frontend files:

- `ravabroad/src/pages/Blogs.jsx`
- `ravabroad/src/pages/BlogDetail.jsx`
- `ravabroad/src/components/BlogFormModal.jsx`
- `ravabroad/src/components/CategoryFormModal.jsx`

Main backend APIs:

- `GET /api/blogs`
- `GET /api/blogs/:slug`
- `GET /api/categories`
- Admin CRUD under `/api/admin/blogs` and `/api/admin/categories`

How it works:

- Blogs page fetches all published blog posts
- Categories are loaded separately and used as filters
- Clicking a card opens the blog detail page by slug
- Blog detail loads one post and usually increments visibility/views on the backend side

## Static Articles

Main frontend files:

- `ravabroad/src/pages/PostDetail.jsx`
- `ravabroad/src/pages/StaticArticle.jsx`
- `ravabroad/src/components/ArticleManager.jsx`

Main backend APIs:

- `GET /api/articles/:slug`
- Admin CRUD under `/api/admin/articles`

How it works:

- Static articles are separate from blogs
- The frontend can render either a blog or article detail page depending on route
- Admins manage static articles through `ArticleManager`
- Article images use the same image upload endpoint used by blog management

## Comments

Main frontend file:

- `ravabroad/src/components/Comments.jsx`

Main backend APIs:

- `GET /api/:type/:id/comments`
- `POST /api/:type/:id/comments`
- `PATCH /api/:type/comments/:id/delete`
- admin hard delete endpoint also exists for comment removal

How it works:

- Comments can be attached to blogs and articles
- Frontend first fetches the post by slug to get its internal database ID
- Then it loads comments for that post
- Replies are nested under parent comments
- Logged-in users can post with their account details
- Guests can still post by entering name and email
- Regular users soft-delete their own comments
- Admins can permanently delete comments

## Site Search

Main frontend file:

- `ravabroad/src/components/SiteSearchModal.jsx`

Main backend API:

- `GET /api/search`

How it works:

- Search modal opens from the layout
- Input is debounced on the frontend
- Backend combines results from multiple sources
- Results are grouped by type like blogs, articles, personalities, temples, menus, and pages
- Backend also returns related keywords

This is one of the main discovery features in the site.

## Dynamic Menus And Dynamic Pages

Main frontend files:

- `ravabroad/src/pages/DynamicPage.jsx`
- `ravabroad/src/pages/Home.jsx`

Main backend APIs:

- `GET /api/menus`
- Admin CRUD under `/api/admin/menus`

How it works:

- Menus are stored in the database
- Home page uses them to render quick links
- The catch-all route loads menu definitions and checks whether the current path matches a saved menu path
- If a match is found, `DynamicPage.jsx` shows a simple placeholder page
- If no match is found, a 404-like page is shown

Important note:

- Dynamic pages currently do not have rich custom content yet
- Right now they are mainly menu-driven placeholder pages

## Famous Personalities

Main frontend file:

- `ravabroad/src/pages/FamousPersonalities.jsx`

Main backend APIs:

- `GET /api/personalities`
- Admin CRUD under `/api/admin/personalities`

How it works:

- Public page fetches personalities with optional filters like caste, region, category, and SC/ST type
- Admins can add, edit, delete, and bulk delete personalities
- Personality images can be uploaded through the shared admin image uploader

## Global Temples Directory

Main frontend file:

- `ravabroad/src/pages/temples-globally.jsx`

Main backend APIs:

- `GET /api/temples`
- Admin CRUD under `/api/admin/temples`

How it works:

- Public page fetches temple records from the backend
- User can filter by country using URL query params
- Clicking a temple opens a details modal
- Temple records can include image, gallery, map link, website, community details, and featured flag

The backend also seeds a few initial temple records if the table is empty.

## Contact And Content Requests

Main frontend files:

- `ravabroad/src/pages/Contact.jsx`
- topbar request trigger inside `ravabroad/src/components/Layout.jsx`

Main backend API:

- `POST /api/content-requests`

How it works:

- The contact page itself is mainly a `mailto:` helper, not a database-backed message form
- Separate from that, the site has an Add / Remove / Report Content request flow
- Those requests are saved in the database and later reviewed in the admin dashboard
