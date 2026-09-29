# Public pages, localization, theme, and runtime

## Current behavior
Next.js App Router uses public/auth/talent/provider/admin route groups. app/layout.tsx composes providers; Sidebar/Navbar supply workspace navigation. Public landing/legal routes cover /, /terms, /privacy, /cookies. Product marketing should reflect implemented usher-booking behavior.

lib/i18n.tsx supports en/ar/ar-eg, stored language preference, and RTL for Arabic. New visible copy should support all languages; some current pages still contain hardcoded English strings. Avoid documenting full translation coverage as complete.

lib/theme.tsx supports light/dark/system with persisted preference; globals.css and shared UI components define styling. Workspace sidebars have responsive/mobile behavior.

Loading UI uses shared `components/ui/Skeleton.tsx` shapes for workspace/auth initialization, App Router transitions, dashboards, lists, profiles, detail pages, QR/check-in, payment status, and async modal options. Skeletons expose a localized screen-reader status and respect reduced motion. Action buttons retain their labels, become disabled/busy, and show a spinning loading icon instead of a square placeholder. Notifications, event history, and booking/referral options distinguish pending reads from empty results.

`components/ui/ToastProvider.tsx` lives above AuthProvider and persists across navigation. `lib/toast.ts` provides success/error/info feedback, a maximum of three visible notices, and brief duplicate suppression. Success copy supports English/Arabic/Egyptian Arabic; backend error strings remain as returned. All notices auto-dismiss after 3 seconds, including while hovered or focused. They remain manually dismissible and announce success politely and errors assertively. Form validation and important persistent inline errors remain visible. Destructive confirmations remain in place.

npm run dev serves port 3001; npm run lint, npm run typecheck, and npm run build are available checks. Backend is a separate repository and API service; no sibling directory or personal configuration is required to use this skill.

## Source entry points
- `app/layout.tsx`
- `app/page.tsx`
- `app/terms/page.tsx`
- `app/privacy/page.tsx`
- `app/cookies/page.tsx`
- `app/globals.css`
- `lib/i18n.tsx`
- `lib/theme.tsx`
- `components/shared/Sidebar.tsx`
- `components/shared/Navbar.tsx`
- `components/ui`
- `components/ui/Skeleton.tsx`
- `components/ui/ToastProvider.tsx`
- `lib/toast.ts`
- `package.json`
- `next.config.ts`

## Change coupling
Presentation changes normally update only this domain when documented behavior changes; avoid unrelated business-domain churn.
