# Administration UI

## Current behavior
Admin layout checks isAdmin. Dashboard/users/events consume platform totals, user lists/invitations, verify/unverify, block/unblock/update/delete, late-excuse reset, event status/deletion, and event-action request resolution.
Active organization owner rows in the user list offer “Switch to {organization name}”. Switching enters the provider workspace; a translucent warning banner identifies the organization and offers Stop to restore the admin dashboard. The banner sits outside the provider profile gate so it remains available if the organization profile is incomplete.
The user invitation password is masked by default and can be revealed with the shared input control.

The API adapter maps backend records to frontend types. UI role checks are navigation controls; backend authorization and final state transitions are authoritative.

User deletion uses the backend soft-delete contract: records are retained with `deletedAt` and excluded from normal GET responses. The user list reloads after deletion, so deleted users/organizations disappear; organization deletion also hides staff and events. The confirmation explains retained data. No deleted-record or restore UI is provided.

## Source entry points
- `app/(admin)/layout.tsx`
- `app/(admin)/admin/dashboard/page.tsx`
- `app/(admin)/admin/users/page.tsx`
- `app/(admin)/admin/events/page.tsx`
- `lib/api.ts`
- `types/index.ts`

## Change coupling
Moderation changes require backend contracts and possibly ROLES.md/events.md.
