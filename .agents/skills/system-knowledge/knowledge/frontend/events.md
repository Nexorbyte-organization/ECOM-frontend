# Events and lifecycle UI

## Current behavior
Provider event list/new/detail implement event creation and management, per-usher budget, dates/times/deadline, locations/gathering point, photo, staffing/gender counts, dress code, and notes.

States are open/confirmed/completed/cancelled. Create and edit forms include an optional standby count limited to half the staff count, rounded up (`maxStandbyCount` in `lib/utils.ts`, mirroring the backend). The owner can open Edit event (`components/events/EditEventModal.tsx`) on open or confirmed events. It mirrors the backend stages: everything is editable while open (pay cannot be lowered after hiring and must be at least 600 EGP per event day), only title/date/times/location/meeting point/venue pin/dress code/notes/standby count once confirmed, and only notes after the event starts; locked fields are disabled and only changed fields are sent. Organizations cannot cancel or delete events, so the page has no cancel, delete, or admin-request controls. From the event date onward the owner sees "Mark completed" (`completeEvent`) on open/confirmed events; the backend only completes events that have ended, and completion unlocks payments. Backend decides allowed transitions.

Talent events browses eligible open work; jobs/[id] presents event details from API. WhatsApp link visibility comes from server serialization; accepted participants may see it. Group workflow uses a supplied link or backend-generated wa.me message-sharing URL; it does not provision a WhatsApp group.

Create and edit forms include an optional venue pin (`components/events/VenuePinField.tsx`, set from the current location) used for "I'm here" check-in. Event detail also contains applicant, supervisor, attendance, check-in, review, and settlement controls; route here first and then load the relevant domain knowledge.

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
- `components/events/EditEventModal.tsx`

## Change coupling
Lifecycle changes can affect applications, attendance, payments, and admin views. Backend determines completion and ownership.
