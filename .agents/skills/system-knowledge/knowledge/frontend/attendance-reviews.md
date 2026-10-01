# QR check-in, attendance, and reviews

## Current behavior
Provider event detail offers attendance recording, reviews, and an attendance QR modal using QRCodeSVG. It creates the QR when not generated or reads the existing one. Creation is disabled outside open status; the backend controls uniqueness and eligibility.

QR encodes the server's checkInUrl. /talent/check-in/[token] submits the token and shows confirmation/errors, including whether the backend recorded the arrival as present or late. The backend only accepts scans from 2 hours before the event starts until 2 hours after it ends. Talent layout preserves the destination through login.

The review comment is optional. The page loads the event's reviews; an usher who has already been rated shows a filled star and a disabled Rated button.

Attendance enum is present/absent/late; excused is an application state. Reviews/rating/reliability/warnings are server data. Repeated QR scans are handled by the backend; no GPS/location validation is implemented.

Present/late attendance determines payable lines on the backend; frontend must use settlement preview rather than derive eligibility independently.

## Source entry points
- `app/(provider)/provider/events/[id]/page.tsx`
- `app/(talent)/talent/check-in/[token]/page.tsx`
- `app/(talent)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `lib/api.ts`
- `types/index.ts`

## Change coupling
Changes must align QR URL/token contracts, attendance API normalization, and payment preview.
