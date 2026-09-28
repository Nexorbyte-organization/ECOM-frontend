# Events and lifecycle UI

## Current behavior
Provider event list/new/detail implement event creation and management, per-usher budget, dates/times/deadline, locations/gathering point, photo, staffing/gender counts, dress code, and notes.

States are open/confirmed/completed/cancelled. Detail UI offers eligible edits/close, direct open-event cancel/delete, and action requests for restricted states. Backend decides allowed transitions.

Talent events browses eligible open work; jobs/[id] presents event details from API. WhatsApp link visibility comes from server serialization; accepted participants may see it. Group workflow uses a supplied link or backend-generated wa.me message-sharing URL; it does not provision a WhatsApp group.

Event detail also contains applicant, supervisor, attendance, QR, review, and settlement controls; route here first and then load the relevant domain knowledge.

Provider event detail links to a dedicated large map page. The owner uploads/replaces the map, clicks it to place and name pins, selects hired ushers for each pin, and can expand the map to full screen. Staff can view the company map. Assigned ushers have a map link from job detail; the map page shows the whole image and only their assigned location, with access enforced by the backend. The map uses percentage coordinates so pins remain in place as the image scales.

## Source entry points
- `app/(provider)/provider/events/page.tsx`
- `app/(provider)/provider/events/new/page.tsx`
- `app/(provider)/provider/events/[id]/page.tsx`
- `app/(talent)/talent/events/page.tsx`
- `app/(talent)/talent/jobs/[id]/page.tsx`
- `lib/api.ts`
- `types/index.ts`
- `app/(provider)/provider/events/[id]/map/page.tsx`
- `app/(talent)/talent/events/[id]/map/page.tsx`
- `components/events/EventMapCanvas.tsx`

## Change coupling
Lifecycle changes can affect applications, attendance, payments, and admin views. Backend determines completion and ownership.
