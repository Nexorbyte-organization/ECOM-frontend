# Public pages, localization, theme, and runtime

## Current behavior
Next.js App Router uses public/auth/talent/provider/admin route groups. app/layout.tsx composes providers; Sidebar/Navbar supply workspace navigation. Public landing/legal routes cover /, /terms, /privacy, /cookies. Product marketing should reflect implemented usher-booking behavior.

lib/i18n.tsx supports en/ar/ar-eg, stored language preference, and RTL for Arabic. New visible copy should support all languages; some current pages still contain hardcoded English strings. Avoid documenting full translation coverage as complete.

lib/theme.tsx supports light/dark/system with persisted preference; globals.css and shared UI components define styling. Workspace sidebars have responsive/mobile behavior.

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
- `package.json`
- `next.config.ts`

## Change coupling
Presentation changes normally update only this domain when documented behavior changes; avoid unrelated business-domain churn.
