# Applications, jobs, excuses, and referrals

## Current behavior
Talent browse/detail applies through the backend; talent jobs lists applications and work with pending/accepted/rejected/excused states. Accepted jobs can be excused under backend rules. API adapter resolves application ID for the event before excusing.

Direct bookings are invitations. On the job detail page a pending direct application shows Accept booking/Decline (profile-gated) through `acceptBookingInvitation`/`declineBookingInvitation` in `lib/api.ts`; the talent events list marks them "Awaiting your answer". The organization event page shows "Awaiting usher" with a Withdraw (reject) action instead of Accept, because the backend refuses organization acceptance of a pending invitation.

Provider detail accepts/rejects applicants and directly books talents; the server enforces duplicates, capacity, profile completion, and same-date conflicts. Organizer profile preference can auto-accept highly rated talents; do not implement independent frontend acceptance rules.

Provider event detail offers “Rebook last team” on an open event when the backend finds a previous team. The action sends pending direct invitations through `/provider/events/:id/rebook-last-team`, reports the number invited, and refreshes applicants.

Referral adapters support existing-talent referrals, signed invite creation/preview/redemption, incoming accept/decline, and event referral listing. Registration can preview an invite; session and backend eligibility are still required.

## Source entry points
- `app/(talent)/talent/events/page.tsx`
- `app/(talent)/talent/jobs/page.tsx`
- `app/(talent)/talent/jobs/[id]/page.tsx`
- `app/(talent)/talent/dashboard/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(provider)/provider/events/[id]/page.tsx`
- `lib/api.ts`
- `types/index.ts`

## Change coupling
Acceptance affects hired lists and event operations. Late-excuse calculation belongs to backend (three days from applicationDeadline).
