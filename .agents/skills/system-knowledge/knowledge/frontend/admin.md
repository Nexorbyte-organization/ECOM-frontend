# Administration UI

## Current behavior
Admin layout checks isAdmin. Dashboard/users/events consume platform totals, user lists/invitations, verify/unverify, block/unblock/update/delete, late-excuse reset, event status/deletion, and event-action request resolution.
The user invitation password is masked by default and can be revealed with the shared input control.

The API adapter maps backend records to frontend types. UI role checks are navigation controls; backend authorization and final state transitions are authoritative.

## Source entry points
- `app/(admin)/layout.tsx`
- `app/(admin)/admin/dashboard/page.tsx`
- `app/(admin)/admin/users/page.tsx`
- `app/(admin)/admin/events/page.tsx`
- `lib/api.ts`
- `types/index.ts`

## Change coupling
Moderation changes require backend contracts and possibly ROLES.md/events.md.
