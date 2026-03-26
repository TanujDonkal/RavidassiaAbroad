# Incident Response

This is a practical incident-response note for the current Ravidassia Abroad stack. It is not a legal guarantee and should be reviewed by the team before production rollout.

## Current Stack Context

- Frontend: React app in `ravabroad/`
- Backend: Express API in `backend/index.js`
- Database: PostgreSQL
- File storage: Cloudinary
- Email providers: Resend and Nodemailer/Gmail
- Auth: JWT and Google Sign-In

## What Counts As A Privacy/Security Incident Here

- unauthorized access to admin-only submission data
- exposure of guest comment emails or sensitive form data
- leaked Cloudinary uploads or publicly guessable sensitive file links
- database dump exposure
- compromised admin account
- misuse of password reset flow
- accidental destructive admin action against user submissions

## Immediate Response Steps

1. Confirm what happened and when.
2. Identify affected systems:
   - frontend only
   - backend only
   - database
   - Cloudinary
   - email provider
   - admin account
3. Contain the issue:
   - rotate JWT secret if token compromise is suspected
   - rotate SMTP/Resend/Cloudinary credentials if provider compromise is suspected
   - disable affected admin accounts
   - temporarily disable affected routes if needed
4. Preserve evidence:
   - copy relevant logs
   - export relevant `admin_audit_logs`
   - save affected record IDs and timestamps
5. Assess impact:
   - what data types were involved
   - how many users/records were affected
   - whether the issue is ongoing

## Repo-Specific Investigation Points

- `backend/index.js`
  - auth routes
  - comment routes
  - SC/ST and matrimonial submission routes
  - content/privacy request routes
  - admin delete/resolve/reply routes
- database tables
  - `users`
  - `scst_submissions`
  - `matrimonial_submissions`
  - `content_requests`
  - `privacy_requests`
  - `blog_comments`
  - `article_comments`
  - `admin_audit_logs`
- Cloudinary folders
  - `ravidassia_profile_dp`
  - `ravidassia_matrimonials`

## Current Controls That Help

- admin-only middleware on sensitive review endpoints
- rate limiting on auth/comments/sensitive forms
- upload type allowlist and size limits
- OTP expiry cleanup
- sanitized free-text inputs
- basic admin audit logging

## Current Gaps / Follow-Up Recommendations

- central structured logging would improve incident review
- provider-side access logging should be enabled and reviewed
- Cloudinary delivery/privacy settings should be reviewed against actual sensitivity
- a documented breach notification workflow still needs legal/operational review
- a scheduled cleanup job for retention/deletion is still pending business decisions

## Communication Note

If a real incident occurs, the team should avoid promising facts before they are verified. Use language like:

- "current investigation indicates"
- "affected records appear to include"
- "legal review is in progress"

That matches the current implementation state better than absolute guarantees.
