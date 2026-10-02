# Event funding, settlements, credit, and saved-card UI

## Advance funding (prefund events)
`components/events/EventFundingCard.tsx` sits under the event header for all provider roles; staff see it read-only (no saved cards or actions). It reads GET /provider/events/:id/funding and shows required (hired × pay), funded, due now, credit, the 48-hour deadline (unfunded bookings are cancelled automatically after it), the automatic release time, an active or unconfirmed Paymob checkout, and the cancellation refund policy. The owner funds the shortfall with credit first (optional checkbox) and a Paymob checkout or saved card for the rest; when credit covers everything no redirect happens. When the hired team is funded and spots remain, the owner can fund extra spots (`extraSeats`), which is required to book ushers after the deadline. When fully funded and open, the owner can confirm the team (PATCH /provider/events/:id/close). Trusted organizations without funding can switch an event to pay-after; a pay-after event shows a variant of the card that can switch back to advance funding. The card reloads when hires, pay, status, or attendance change.

Once the event is completed or check-in has closed the card shows who will be paid (checked-in ushers with their 95% amount and payout-account state) and who has not checked in (no-show: wage refunded, booking fee kept), the amount refunded to the paying card, and the automatic release time. The owner can press Release now once check-in has closed. After release it lists each usher's payout state (Paid, Payout pending, Needs payout account, Payout error with Retry when safe) and the card refunds (in progress, refunded to card, or added to credit when the refund failed). Pay-all/individual checkout and cash controls appear only for pay-after events.

/provider/payments/result handles `fundingId` (polls GET /payments/fundings/:id) as well as `settlementId`. /provider/payments (owner only, sidebar "Payments") shows the credit balance (spent on future funding; there are no withdrawals), tier status with progress and reasons, credit history, and refunds to the card.

Ushers: /talent/jobs/[id] shows a pay-protection notice for hired ushers (secured, awaiting funding, released, pay-after) from the usher event response, plus the check-in card on the event day (see [attendance](attendance-reviews.md)). /talent/events shows a no-show suspension notice when `suspendedUntil` is in the future. Admin: /admin/payments lists failed card refunds (already converted to credit) and underfunded events; there are no disputes or withdrawals to decide. `?org=<id>` (linked from organization rows on /admin/users) shows the tier with an override select, credit with signed adjustments, and credit history.

Copy in these views is English, except the usher-facing notices and check-in card, which also support Arabic; action toasts support all three languages.

## Pay-after settlements
Completed event detail lets the owner load server preview and initiate Pay all ushers. Preview includes gross, collection, 5% fee, entitlement, cash due, payout configuration, lines, and saved cards. Unexpired pending checkout is reused; checkout redirects to Paymob.

Pay all ushers opens the checkout panel. After the owner completes one Paymob collection, the backend automatically sends payouts to every eligible digital recipient. The panel blocks a new checkout when digital recipients exist and the Payouts sandbox is not configured; the backend enforces the same rule. Cash recipients remain direct organization payments.

Result page polls authenticated server settlement state. Return query parameters are not payment evidence. Collection success and payout completion are separate statuses.

Digital lines collect full budget and pay 95% entitlement; cash lines collect fee only and show remaining cash due. Unsupported/incomplete payout methods are highlighted for cash handling. Cash-paid action records handover through backend authorization.

Before starting a checkout, the owner can select Pay in cash instead for individual ushers who have a supported payout account. The panel recalculates the Paymob charge and cash due, then sends their IDs as `excludedTalentIds` when creating the settlement. The backend validates eligibility and calculates final amounts. Active checkouts and paid settlements show their saved lines; payout choices are locked until an active checkout expires. A cash line still owes its 5% platform fee through Paymob and its 95% entitlement directly from the organizer.

The owner can also start a separate Paymob checkout for one eligible usher when bulk collection has not started or has definitively failed. Once any individual checkout starts, the event switches to individual payment completion and cannot start bulk collection. On completed events the attendance list shows a payment status beside every hired usher: Paid, Payment error, Payout error, Payment/Payout pending, Cash due, or Not paid yet. Ushers who did not check in show that they are not paid, and the payment panel lists them as not included. A confirmed failed digital payout after successful collection offers Retry payout without another organization charge; ambiguous or still-processing payouts do not offer retry. Individual cash lines retain the existing Mark cash paid action.

Company profile lists/removes cards and includes enrollment/status/default-card actions. Backend staging now exposes the matching enrollment creation/status and default-card routes used by lib/api.ts. Owned active saved test cards can be passed to settlement checkout. Availability on a deployed backend depends on its checked-out version; real sandbox checkout still requires merchant configuration and end-to-end verification.

This is Paymob Test/Sandbox integration; live collection and complete payout reconciliation are not implemented or verified.

## Source entry points
- `components/events/EventFundingCard.tsx`
- `components/payments/paymentLabels.ts`
- `components/payments/PayProtectionNotice.tsx`
- `components/payments/HeldPayList.tsx`
- `app/(provider)/provider/payments/page.tsx`
- `app/(admin)/admin/payments/page.tsx`
- `app/(talent)/talent/events/page.tsx`
- `app/(talent)/talent/jobs/[id]/page.tsx`
- `app/(provider)/provider/events/[id]/page.tsx`
- `app/(provider)/provider/payments/result/page.tsx`
- `app/(provider)/provider/profile/page.tsx`
- `app/(talent)/talent/profile/page.tsx`
- `lib/api.ts`
- `types/index.ts`

## Change coupling
Backend calculates money in cents and validates attendance, owner, callback, and payout rules. Contract changes require coordinated backend changes.
