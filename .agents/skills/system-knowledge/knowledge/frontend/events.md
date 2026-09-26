# Events and lifecycle UI

## Current behavior
Provider event list/new/detail implement event creation and management, per-usher budget, dates/times/deadline, locations/gathering point, photo, staffing/gender counts, dress code, and notes.

States are open/confirmed/completed/cancelled. Detail UI offers eligible edits/close, direct open-event cancel/delete, and action requests for restricted states. Backend decides allowed transitions.

Talent events browses eligible open work; jobs/[id] presents event details from API. WhatsApp link visibility comes from server serialization; accepted participants may see it. Group workflow uses a supplied link or backend-generated wa.me message-sharing URL; it does not provision a WhatsApp group.

Event detail also contains applicant, supervisor, attendance, QR, review, and settlement controls; route here first and then load the relevant domain knowledge.

## Source entry points
- `app/(provider)/provider/events/page.tsx`
- `app/(provider)/provider/events/new/page.tsx`
- `app/(provider)/provider/events/[id]/page.tsx`
- `app/(talent)/talent/events/page.tsx`
- `app/(talent)/talent/jobs/[id]/page.tsx`
- `lib/api.ts`
- `types/index.ts`

## Change coupling
Lifecycle changes can affect applications, attendance, payments, and admin views. Backend determines completion and ownership.
