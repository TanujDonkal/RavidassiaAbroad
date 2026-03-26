# Privacy Checklist

This checklist describes the current privacy/compliance baseline implemented in this repository as of policy version `2026-03-25`.

## Public Pages

- `Privacy Policy` page is available in the frontend.
- `Terms of Use` page is available in the frontend.
- `Community Guidelines` page is available in the frontend.
- `Privacy / Data Request` page is available in the frontend.
- Footer links point to all legal/privacy pages.

## Privacy Contact

- Frontend uses `REACT_APP_PRIVACY_CONTACT_EMAIL`.
- Backend uses `PRIVACY_CONTACT_EMAIL`.
- Privacy contact is shown on the Privacy Policy page and the Privacy / Data Request page.
- Request confirmation UI for content/privacy requests references the privacy contact.

## Consent Notices

- Signup includes Terms/Privacy acknowledgment and optional marketing opt-in.
- Connect SC/ST includes a collection notice, required consent checkbox, and optional marketing opt-in.
- Matrimonial includes a collection notice, required consent checkbox, and optional marketing opt-in.
- Guest comment forms include a collection notice and required guest consent checkbox.
- Content request modal includes a collection notice, required consent checkbox, and optional marketing opt-in.

## Stored Consent Metadata

Current implementation stores consent metadata for:

- `scst_submissions`
- `matrimonial_submissions`
- `content_requests`
- `blog_comments`
- `article_comments`
- `users` policy acknowledgment and marketing preference

Fields added where applicable:

- `consent_given`
- `consent_version`
- `consent_given_at`
- `marketing_opt_in`

## Privacy Request Handling

- Public users can submit access, correction, deletion, or account deletion requests.
- Requests are stored in `privacy_requests`.
- Admins can review, resolve, delete, and bulk delete privacy requests.
- Account deletion requests from authenticated users also set `users.deletion_requested_at`.

## Backend Controls

- `helmet` baseline enabled.
- Custom security headers remain in place.
- Rate limiting applied to:
  - auth routes
  - comments
  - sensitive public form submissions
- File uploads limited to image MIME types and 5 MB.
- Sensitive forms validate required fields and consent server-side.
- Public comment endpoints no longer expose guest email addresses.
- Sensitive admin routes require admin auth.
- Rich text and free-text request/comment inputs are sanitized before storage.
- Error responses are kept generic for public-facing failures.

## Audit Logging

Current audit logging covers at least:

- SC/ST submission view/delete/bulk delete/reply
- matrimonial submission view/delete/bulk delete
- content request delete/bulk delete
- privacy request resolve/delete/bulk delete
- comment hard delete by admin
- user role changes

Audit rows are written to `admin_audit_logs`.

## Open Items Requiring Human Decision

- Final retention periods for each data category
- Exact deletion workflow for withdrawn/deleted records
- Whether newsletter/promotional emailing will actually be operated for stored opt-ins
- Final legal review of the public legal page text
- Identity verification process for privacy/data request fulfillment
