# Auth And Profile

## What This Feature Covers

- Email sign up
- Email sign in
- Google sign in
- Forgot password with OTP
- Logged-in user session
- User profile update

## Main Frontend Files

- `ravabroad/src/pages/Auth.jsx`
- `ravabroad/src/pages/ForgotPassword.jsx`
- `ravabroad/src/pages/Profile.jsx`
- `ravabroad/src/components/ProtectedRoute.jsx`
- `ravabroad/src/utils/formDrafts.js`

## Main Backend APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/request-reset`
- `POST /api/auth/reset-password`
- `POST /api/user/update-profile`

## Sign Up And Sign In Flow

The auth page has two modes:

- Sign in
- Sign up

After successful login or signup:

- Token is saved in `localStorage`
- User object is saved in `localStorage`
- An `auth-updated` browser event is dispatched
- The user is redirected either to the saved target page or home

This redirect behavior is important for protected form flows like matrimonial and Connect SC/ST.

## Google Login Flow

`Auth.jsx` waits for the Google SDK and renders Google buttons for both sign-in and sign-up sections.

When Google returns a credential:

- Frontend sends it to `POST /api/auth/google`
- Backend verifies the token
- Backend returns app JWT + user object
- Frontend stores them like a normal login

## Forgot Password Flow

The password reset is OTP-based.

Simple flow:

1. User enters email
2. Backend checks if that email exists
3. Backend generates and stores an OTP
4. User submits OTP + new password
5. Backend verifies OTP and updates password

## Profile Flow

The profile page loads the user from `localStorage`, not from a fresh API call.

When the user updates profile:

- Frontend builds a `FormData` payload
- Optional profile photo is included
- Backend updates the user record and image
- Frontend replaces the local stored user with the new data

## Session And Redirect Helpers

`formDrafts.js` is small but important.

It stores:

- unfinished form draft data in `sessionStorage`
- the page the user should return to after login

This is why a user can start a protected form, get asked to login, and then come back without losing everything.

## Developer Notes

- The profile page currently contains some placeholder UI cards and social links
- Auth state is mostly localStorage-based, so if local storage is stale, UI can also become stale until refreshed
