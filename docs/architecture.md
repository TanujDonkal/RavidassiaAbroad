# Architecture Overview

## High-Level Picture

The app has one React frontend and one Express backend.

- React handles pages, forms, modals, navigation, and admin UI
- Express handles auth, database reads/writes, uploads, search, comments, and admin APIs
- PostgreSQL stores users, posts, categories, submissions, menus, temples, personalities, and more

## Frontend Flow

The main frontend entry is `ravabroad/src/App.js`.

What `App.js` does:

- Lazily loads most pages
- Wraps the app in `ErrorBoundary`
- Wraps the app in `PopupProvider` for reusable popups
- Shows a global loader during route changes
- Uses `Layout` for the shared topbar, navbar, footer, and search modal
- Protects the `/admin` route with `ProtectedRoute`

## Routing Structure

Main routes include:

- `/` home page
- `/about`
- `/blogs`
- `/blogs/:slug`
- `/articles/:slug`
- `/personalities`
- `/temples-globally`
- `/connect-scst`
- `/matrimonial`
- `/auth`
- `/forgot-password`
- `/profile`
- `/admin`

There is also a fallback route handled by `DynamicPage.jsx`.

## Shared Layout

`Layout.jsx` is the common shell for most pages.

It provides:

- Top contact bar
- Main navigation
- Login/profile access through `AuthMenu`
- Search modal
- Footer
- Link to the content request modal

## Backend Structure

The backend is mostly implemented in one file: `backend/index.js`.

That file does all of this:

- Loads environment variables
- Configures CORS
- Connects to PostgreSQL
- Initializes tables
- Configures Cloudinary uploads
- Creates auth middleware
- Defines public and admin API routes
- Starts the Express server

## How Frontend Talks To Backend

The main frontend API helper is `ravabroad/src/utils/api.js`.

Important behavior:

- Chooses local or production backend based on hostname
- Prefixes all requests with `/api`
- Automatically attaches JWT token from `localStorage`
- Supports both JSON and `FormData`
- Throws readable errors when an API request fails

## Shared State Patterns

The app mostly uses local component state, not a global state library.

Common data sources:

- `localStorage` for JWT token and user object
- `sessionStorage` for form drafts and post-login redirect targets
- API fetches for live data

## Access Control

There are two main layers:

- Frontend route protection with `ProtectedRoute.jsx`
- Backend route protection with `requireAuth` and `requireAdmin`

Current implementation note:

- Frontend admin route currently allows `main_admin` and `moderate_admin`
- Backend admin middleware allows `admin`, `main_admin`, and `moderate_admin`

So backend and frontend role checks are close, but not fully identical.
