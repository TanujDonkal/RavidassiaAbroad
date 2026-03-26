# Data Retention Policy

This file documents the current implementation and the retention decisions that still need business/legal input. It is not a final legal policy.

## Current Principle

Keep personal data only as long as needed to operate the current Ravidassia Abroad features, handle moderation/admin review, respond to user requests, and protect the platform from abuse. Exact timelines still need a human decision.

## Data Types

### Guest comment emails

- Current implementation:
  - Collected for guest comment moderation and management.
  - Not returned in public comment responses.
- Business decision needed:
  - How long to keep guest emails after comment deletion or moderation closure.

### Content requests

- Current implementation:
  - Stored in `content_requests` with consent metadata and optional marketing preference.
  - Admins can delete records manually.
- Business decision needed:
  - How long closed requests should be retained before cleanup.

### SC/ST submissions

- Current implementation:
  - Stored in `scst_submissions` with consent metadata.
  - Latest user submission is updated in place and older duplicates are removed.
  - Admin actions are auditable.
- Business decision needed:
  - How long to keep approved, rejected, or inactive submissions.

### Matrimonial submissions

- Current implementation:
  - Stored in `matrimonial_submissions` with consent metadata.
  - Latest user submission is updated in place and older duplicates are removed.
  - Includes potentially sensitive personal data and photos.
- Business decision needed:
  - When inactive or withdrawn biodata should be archived or deleted.

### Inactive users

- Current implementation:
  - Accounts remain unless deleted manually or flagged through a privacy request.
  - `deletion_requested_at` exists for future cleanup workflows.
- Business decision needed:
  - Define inactivity threshold and account cleanup process.

### Password reset OTPs

- Current implementation:
  - Stored only in memory.
  - Expire after 5 minutes.
  - Cleanup job removes expired OTPs from memory.

### Deleted or withdrawn records

- Current implementation:
  - Some records are hard deleted by admins.
  - User account deletion requests are marked with `deletion_requested_at`.
- Business decision needed:
  - Decide whether a short hold period is needed for abuse, fraud, or legal review.

## Suggested Next Step

Create one config-backed cleanup job after the business/legal team chooses retention windows. The current repo is ready for that follow-up because:

- consent/version timestamps now exist
- privacy deletion intent can be marked
- audit logging exists for sensitive admin actions

## Legal Review Note

Any final retention numbers should be reviewed for Canadian privacy-law fit and for any province-specific or organization-specific obligations.
