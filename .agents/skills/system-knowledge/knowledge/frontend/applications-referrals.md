# Applications, jobs, excuses, and referrals

## Current behavior
Talent browse/detail applies through the backend; talent jobs lists applications and work with pending/accepted/rejected/excused states. Accepted jobs can be excused under backend rules. API adapter resolves application ID for the event before excusing.

Provider detail accepts/rejects applicants and directly books talents; the server enforces duplicates, capacity, profile completion, and same-date conflicts. Organizer profile preference can auto-accept highly rated talents; do not implement independent frontend acceptance rules.

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
