# Post-event settlements and saved-card UI

## Current behavior
Completed event detail lets the owner load server preview and initiate Pay all ushers. Preview includes gross, collection, 5% fee, entitlement, cash due, payout configuration, lines, and saved cards. Unexpired pending checkout is reused; checkout redirects to Paymob.

Result page polls authenticated server settlement state. Return query parameters are not payment evidence. Collection success and payout completion are separate statuses.

Digital lines collect full budget and pay 95% entitlement; cash lines collect fee only and show remaining cash due. Unsupported/incomplete payout methods are highlighted for cash handling. Cash-paid action records handover through backend authorization.

Company profile lists/removes cards and includes enrollment/status/default-card actions. Backend staging now exposes the matching enrollment creation/status and default-card routes used by lib/api.ts. Owned active saved test cards can be passed to settlement checkout. Availability on a deployed backend depends on its checked-out version; real sandbox checkout still requires merchant configuration and end-to-end verification.

This is Paymob Test/Sandbox integration; live collection and complete payout reconciliation are not implemented or verified.

## Source entry points
- `app/(provider)/provider/events/[id]/page.tsx`
- `app/(provider)/provider/payments/result/page.tsx`
- `app/(provider)/provider/profile/page.tsx`
- `app/(talent)/talent/profile/page.tsx`
- `lib/api.ts`
- `types/index.ts`

## Change coupling
Backend calculates money in cents and validates attendance, owner, callback, and payout rules. Contract changes require coordinated backend changes.
