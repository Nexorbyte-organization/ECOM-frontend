# Authentication and API transport

## Current behavior
AuthProvider loads /auth/me on mount, caches non-secret user metadata under usher_user, and keeps token null. No bearer/refresh token is stored in local storage. Registration supports talent/provider mapping to usher/organizer and does not create a session before email verification.

lib/api.ts is the HTTP boundary: credentials include, no-store, JSON/FormData handling, response normalization, and backend error messages. A 401 outside excluded auth paths shares one refresh request and retries once; remaining unauthorized responses emit usher:unauthorized to clear the session.

User-facing mutations are exported through `withFeedback` from `lib/toast.ts`. Feedback runs after the complete logical action resolves, including follow-up image uploads; failures emit an error notice and rethrow for existing inline handling. Data reads, session initialization/refresh, notification clicks, logout, and background polling do not emit automatic success notices. Payment settlement preparation does not claim that a payment is confirmed. Transport payloads and backend contracts are unchanged.

Login/recovery pages implement email/password and token-bound password recovery. Talent layout saves a pending check-in destination in sessionStorage before redirecting to login.

The shared `components/ui/Input.tsx` masks password inputs by default and provides a localized eye button to show or hide each field independently. This also applies to registration confirmation, reset confirmation, and password fields in staff/admin forms.

Default browser prefix /api is rewritten to the backend by next.config.ts; API_URL configures the destination and NEXT_PUBLIC_API_URL can override browser prefix.

## Source entry points
- `lib/auth.tsx`
- `lib/api.ts`
- `next.config.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/verify-otp/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/(talent)/layout.tsx`

## Change coupling
Backend is authoritative for sessions/authorization. Keep normalized frontend roles and cookie transport aligned.
