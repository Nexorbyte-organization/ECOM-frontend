# Public pages, localization, theme, and runtime

## Current behavior
Next.js App Router uses public/auth/talent/provider/admin route groups. app/layout.tsx composes providers; Sidebar/Navbar supply workspace navigation. Public landing/legal routes cover /, /terms, /privacy, /cookies, /policies/ushers, /policies/organizations, and /policies/payments. Legal pages share `components/shared/LegalPage.tsx`, which holds the policy navigation (`LEGAL_PAGES`) and effective date (`LEGAL_EFFECTIVE_DATE`). Policy text describes implemented backend rules (excuse limits, check-in window, event lifecycle, fees, payouts, data sharing); update it and the effective date when those rules change. Product marketing should reflect implemented usher-booking behavior.

lib/i18n.tsx supports en/ar/ar-eg, stored language preference, and RTL for Arabic. New visible copy should support all languages; some current pages still contain hardcoded English strings. Avoid documenting full translation coverage as complete.

lib/theme.tsx supports light/dark/system with persisted preference; globals.css and shared UI components define styling. Workspace navigation is a top bar on desktop and a bottom bar on phones.

Visual identity: `app/globals.css` holds the design tokens. Names are stable (`primary`, `accent`, `dark-*`) so screens follow without edits. The palette is graphite and teal, chosen to be professional and calm: `primary` is teal (actions, links, brand), `accent` is a brighter teal used only as the highlight on a graphite field (Check in, live, unread), `success` green means booked / present / paid, `warning` amber means filling / needs attention, `danger` red is for problems, `bottle*` is the graphite field (next-shift panel, hero, summary, auth; deep teal-graphite in dark mode), and `dark-*` is a cool graphite neutral scale inverted per theme. Event categories share one quiet teal tint (`cat-*` tokens and `lib/ticket.ts` all resolve to teal), so colour is kept for meaning rather than decoration. Rating stars use `star` (amber). Shape is one scale (10px controls, 14px panels) with 1px `edge` borders; shadows are tinted and only on things that float. Fonts load in `app/layout.tsx` with `next/font`: Outfit (headings, `.display` / `.display-sm`) and Figtree (text); Readex Pro covers Arabic for both. One icon family (lucide) at a global 1.75 stroke. Use `Badge` for status (soft tint plus dot), `Tabs` for underline tabs, `Button` (solid primary, quiet secondary, `signal` for the one sun-yellow action on a dark field). An event is drawn as a row everywhere (`components/events/EventRow.tsx` inside `RowList`, from `components/ui/Ticket.tsx`): tinted date block, title, where and when, `FillBar` for staffing. `NextUp` is the home-screen countdown block. The logo (`components/shared/BrandLogo.tsx`) turns the two O's of the name into two people: the usher (strongest text colour) guiding the guest (primary teal) with one arm; it takes its colours from theme tokens, so it follows light and dark mode, and `inverted` is for graphite fields. `app/icon.svg` is the favicon and switches with the browser's colour scheme. The landing hero windows (`.punch-window`), `PunchConfirm` for check-in and `lib/burst.ts` (a small burst on accept) keep the circle motif. `lib/copy.ts` (`useCopy`) holds per-screen en/ar/ar-eg copy. Arabic never gets letter-spacing. Visible copy avoids em dashes.

Navigation: there is no sidebar. `components/shared/Navbar.tsx` is the top bar (logo, `TopTabs`, notifications, theme, language, sign out) and `components/shared/WorkspaceNav.tsx` decides each role's tabs (`useWorkspaceNav`) and renders the phone bottom bar (`BottomNav`; organizers get a raised centre button that starts an event, extra destinations sit under "More"). Home screens lead with the next event/shift, not stat cards; lists are ticket feeds with `Tabs` filters.

Loading UI uses shared `components/ui/Skeleton.tsx` shapes for workspace/auth initialization, App Router transitions, dashboards, lists, profiles, detail pages, QR/check-in, payment status, and async modal options. Skeletons expose a localized screen-reader status and respect reduced motion. Action buttons retain their labels, become disabled/busy, and show a spinning loading icon instead of a square placeholder. Notifications, event history, and booking/referral options distinguish pending reads from empty results.

`components/ui/ToastProvider.tsx` lives above AuthProvider and persists across navigation. `lib/toast.ts` provides success/error/info feedback, a maximum of three visible notices, and brief duplicate suppression. Success copy supports English/Arabic/Egyptian Arabic; backend error strings remain as returned. All notices auto-dismiss after 3 seconds, including while hovered or focused. They remain manually dismissible and announce success politely and errors assertively. Form validation and important persistent inline errors remain visible. Destructive confirmations remain in place.

Deployment updates: `next.config.ts` bakes `NEXT_PUBLIC_APP_VERSION` (Vercel deployment ID, else commit SHA, else build time; `dev` under `next dev`, which disables checks). `app/version/route.ts` serves the running deployment's version uncached at `/version`. `components/shared/UpdateNotice.tsx` mounts `UpdateBanner` in the root layout; it compares versions on focus/visibility, every 5 minutes, and after uncaught chunk-load or missing-server-action errors, then shows a localized "new version available" notice with a Refresh button. `app/error.tsx` and `app/global-error.tsx` replace the default crash screen with the same refresh prompt when the error comes from a stale build or a newer deployment exists, and otherwise a localized generic error with Refresh. Logic lives in `lib/version.ts`.

npm run dev serves port 3001; npm run lint, npm run typecheck, and npm run build are available checks. Backend is a separate repository and API service; no sibling directory or personal configuration is required to use this skill.

## Source entry points
- `app/layout.tsx`
- `app/page.tsx`
- `app/terms/page.tsx`
- `app/privacy/page.tsx`
- `app/cookies/page.tsx`
- `app/policies/ushers/page.tsx`
- `app/policies/organizations/page.tsx`
- `app/policies/payments/page.tsx`
- `components/shared/LegalPage.tsx`
- `app/globals.css`
- `lib/i18n.tsx`
- `lib/theme.tsx`
- `components/shared/WorkspaceNav.tsx`
- `components/shared/Navbar.tsx`
- `components/ui`
- `components/ui/Skeleton.tsx`
- `components/ui/ToastProvider.tsx`
- `lib/toast.ts`
- `lib/version.ts`
- `components/shared/UpdateNotice.tsx`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/version/route.ts`
- `package.json`
- `next.config.ts`

## Change coupling
Presentation changes normally update only this domain when documented behavior changes; avoid unrelated business-domain churn.
