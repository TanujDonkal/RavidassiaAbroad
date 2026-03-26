# Community Forms

## What This Feature Covers

- Connect SC/ST by country
- Matrimonial biodata
- Content request submissions

These flows are important because they mix:

- frontend forms
- login protection
- draft saving
- backend submission storage
- admin review actions

## Connect SC/ST By Country

Main frontend file:

- `ravabroad/src/pages/connect-scst.jsx`

Main backend APIs:

- `POST /api/scst-submissions`
- `GET /api/scst-submissions/mine`
- Admin review endpoints under `/api/admin/scst-submissions`
- `POST /api/admin/scst-reply`

### User flow

1. User opens the page and fills form fields like name, email, country, phone, and proof
2. Draft is saved in `sessionStorage`
3. If user is not logged in and tries to submit, the app asks them to register/login
4. After login, the user returns to the same form
5. Submission is saved in the database
6. The page then shows the user their saved submission instead of a blank form
7. User can switch into edit/update mode

### Admin flow

Admins can:

- view submissions
- delete submissions
- bulk delete submissions
- open a reply modal

When replying:

- admin adds WhatsApp group link and rules
- backend sends an email
- backend prepares a WhatsApp deep link
- frontend opens that WhatsApp link in a new tab
- submission is marked as replied

## Matrimonial Biodata

Main frontend file:

- `ravabroad/src/pages/MatrimonialForm.jsx`

Main backend APIs:

- `POST /api/matrimonial-submissions`
- `GET /api/matrimonial-submissions/mine`
- Admin review endpoints under `/api/admin/matrimonial`

### User flow

This is a 5-step form:

1. Personal details
2. Location
3. Education and profession
4. Family background
5. Partner preferences and photo

Important behavior:

- Required fields are validated per step
- Draft data is saved in `sessionStorage`
- Photo is compressed in the browser before submit
- Submit uses `FormData` because of the image upload
- If user is not logged in, redirect-to-login flow is used
- After submit, a success modal appears
- Then the page reloads the user’s saved biodata and shows it in view mode
- User can later edit and resubmit

### Admin flow

Admins can:

- view all matrimonial submissions
- delete and bulk delete
- open a details modal
- generate/download an Instagram-style card from a submission

## Content Request Flow

Main backend API:

- `POST /api/content-requests`

Purpose:

- lets users report wrong content
- ask for removal
- ask for new content to be added

These requests do not directly change the site.

Instead:

- request is saved in database
- admin sees it in the dashboard
- admin manually decides what to do next

## Why Draft Saving Matters

Both protected forms use the same idea:

- save draft in `sessionStorage`
- remember post-login target page
- restore data after auth

This makes long forms much safer for users and reduces drop-off.
