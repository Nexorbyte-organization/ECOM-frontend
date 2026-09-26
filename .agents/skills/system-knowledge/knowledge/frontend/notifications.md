# Notifications and navigation

## Current behavior
Navbar consumes real backend notifications via lib/api.ts: list, mark one read, mark all read, and clear. Notification normalizer maps recipient/content/type/link/read fields for the UI.

Links target app routes. Email delivery is backend behavior; frontend notification existence is not proof of email delivery. A legacy SimulatedEmail type remains in types/index.ts but is not an implemented email log.

## Source entry points
- `components/shared/Navbar.tsx`
- `lib/api.ts`
- `types/index.ts`
- `components/shared/Sidebar.tsx`

## Change coupling
Keep link targets, read state, and API payload mapping aligned with backend.
