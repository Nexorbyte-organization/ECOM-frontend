# Check-in, attendance, and reviews

## Current behavior
Check-in is the only attendance record. Provider event detail shows a Check-in card (any organization role, until release) linking to /provider/events/[id]/check-in. That staff screen watches the phone's location (`lib/geolocation.ts`), calls PUT /provider/events/:id/check-in-points/me every 10 seconds, and shows the rotating QR (QRCodeSVG of `checkInUrl`), the 6-digit code with a countdown, the check-in window when closed, and a location-required message when the browser blocks location. An optional label names the point (e.g. Bus 1); Close stops the point.

/talent/check-in/[token] reads the device location and submits `method: qr` with the token; errors (expired code, too far, location blocked) offer Try again. On the event day /talent/jobs/[id] shows `components/events/UsherCheckInCard.tsx` to hired ushers: type the 6-digit code or press "I'm here" (both send the location). The backend enforces the window (2 hours before the start until 2 hours after the end), the 200 m distance, and code freshness. Talent layout preserves the destination through login.

The Attendance tab lists hired ushers with their status and how it was recorded (Scanned QR, Typed code, Checked in by location, Checked in by staff, Did not check in). Staff can Check in (present) or Late for an usher whose phone cannot check in, sending the staff phone's location when available; there is no Absent button and no control for ushers who checked in themselves. Missed check-ins become absent automatically when check-in closes.

The review comment is optional. The page loads the event's reviews; an usher who has already been rated shows a filled star and a disabled Rated button. Attendance enum is present/absent/late; excused is an application state. Reviews/rating (weighted by organization)/reliability/suspension are server data.

Present/late attendance determines payable lines on the backend; frontend must use the funding summary or settlement preview rather than derive eligibility independently.

## Source entry points
- `app/(provider)/provider/events/[id]/page.tsx`
- `app/(provider)/provider/events/[id]/check-in/page.tsx`
- `app/(talent)/talent/check-in/[token]/page.tsx`
- `components/events/UsherCheckInCard.tsx`
- `lib/geolocation.ts`
- `app/(talent)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `lib/api.ts`
- `types/index.ts`

## Change coupling
Changes must align check-in point/QR token contracts, location payloads, attendance API normalization, and the funding summary.
