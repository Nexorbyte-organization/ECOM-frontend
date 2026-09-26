# Organization staff and supervisors

## Current behavior
Owner staff page invites, edits role/details, blocks/unblocks, and removes staff. Members and supervisors share the provider workspace; ownership is distinct from isProvider.

Event detail loads staff, filters supervisor-role options, and assigns/removes supervisors through the backend. User.providerProfileId normalizes backend providerOwnerId.

Backend company ownership is authoritative; supervisor assignment is not currently an event-query access restriction. The frontend must not claim assigned-only access without a backend change.

## Source entry points
- `app/(provider)/provider/staff/page.tsx`
- `app/(provider)/provider/events/[id]/page.tsx`
- `app/(provider)/layout.tsx`
- `lib/auth.tsx`
- `lib/api.ts`
- `types/index.ts`
- `components/shared/Sidebar.tsx`

## Change coupling
Role/access changes require ROLES.md and backend authorization updates.
