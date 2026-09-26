# OO-Ushers Frontend — Implementation and Logic

> Status snapshot: 13 September 2026
> Repository: `usher-frontend`  
> Runtime: Next.js 16, React 19, TypeScript, Tailwind CSS 4

This document is a historical implementation snapshot. For current maintained behavior, start at [.agents/skills/system-knowledge/knowledge/INDEX.md](.agents/skills/system-knowledge/knowledge/INDEX.md), then read only the relevant domain and source files. Source code is authoritative when this snapshot differs.

## 1. Product scope

OO-Ushers is an usher-booking and event-operations platform. Organizations create events, review and book ushers, record attendance, rate performance, issue warnings through the attendance/excuse workflow, and pay after an event. Ushers complete their profiles, browse and apply for events, manage accepted jobs, receive referrals, and register a payout method.

The public website intentionally describes usher booking only. Unsupported claims such as identity/criminal checks, GPS check-ins, broad event-crew categories, and unverified performance statistics have been removed or hidden.

## 2. Application structure

- `app/page.tsx`: public landing page and marketing sections.
- `app/(auth)`: login and registration.
- `app/(talent)`: usher experience.
- `app/(provider)`: organization and organization-staff experience.
- `app/(admin)`: administration experience.
- `components/shared`: navigation, sidebar, branding, language controls, and profile-completion gate.
- `components/ui`: reusable buttons, cards, inputs, modals, selects, badges, avatars, and option pickers.
- `lib/api.ts`: the single frontend-to-backend HTTP adapter and response normalizer.
- `lib/auth.tsx`: current-session state and role helpers.
- `lib/i18n.tsx`: English, Modern Standard Arabic, and Egyptian Arabic copy plus RTL behavior.
- `lib/theme.tsx`: light, dark, and system theme behavior.
- `lib/profile-completion.ts`: required-profile rules shared by the frontend gate.
- `types/index.ts`: frontend domain and API types.

## 3. Routing and roles

### Public and authentication

- `/`: landing page.
- `/login`: email/password login.
- `/register`: usher or organization registration, including signed referral invite previews.
- `/forgot-password`, `/verify-otp`, `/reset-password`: token-bound password recovery.
- `/terms`, `/privacy`, `/cookies`: public legal information.

Registration maps frontend roles to backend roles:

- `talent` → `usher`
- `provider` → `organizer`

Registration does not create a fake local session. The user must finish the backend email-verification flow before normal login succeeds.

### Usher routes

- `/talent/dashboard`: personal summary and activity.
- `/talent/events`: browse available events.
- `/talent/jobs`: applications and accepted work.
- `/talent/jobs/[id]`: event/job details and permitted actions.
- `/talent/profile`: personal information, skills/preferences, photo, and payout methods.

### Organization routes

- `/provider/dashboard`: organization summary.
- `/provider/events`: event list and management.
- `/provider/events/new`: event creation.
- `/provider/events/[id]`: event details, applicants, attendance, reviews, referrals, supervisors, and settlement.
- `/provider/talent`: usher search.
- `/provider/talent/[id]`: usher profile and history.
- `/provider/staff`: organization staff and supervisors.
- `/provider/profile`: organization information and logo.
- `/provider/payments/result`: Paymob return page and settlement-status polling.

### Admin routes

- `/admin/dashboard`: platform overview.
- `/admin/users`: user administration.
- `/admin/events`: event administration and action requests.

## 4. Authentication and API communication

The frontend no longer uses mock data or a simulated backend. `lib/api.ts` sends requests to the real Express API.

- Browser requests use the same-origin `/api` prefix.
- `next.config.ts` rewrites `/api/:path*` to the backend.
- Local default backend: `http://localhost:4000`.
- Same-origin, HTTP-only cookies carry short-lived access and rotating refresh sessions.
- The API adapter makes one refresh attempt after an expired session and then signs the browser out.
- No bearer or refresh token is stored in local storage.
- API responses are normalized so backend role and field names map to existing frontend types.
- Failed API calls surface backend messages to the UI.

Local frontend environment:

```env
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=/api
```

The frontend runs on port `3001` using `npm run dev`.

## 5. Profile completion restrictions

`ProfileCompletionGate` protects usher and organization workspaces.

### Incomplete usher

An incomplete usher can sign in and view the platform, but cannot apply, refer, excuse from accepted work, or perform other protected actions. A persistent alert at the top explains that the profile must be completed and links to `/talent/profile`.

### Incomplete organization

An incomplete organization can sign in and view its workspace, but cannot create or modify events, book ushers, record operational changes, manage staff, or initiate settlement. A persistent alert links to `/provider/profile`.

The frontend disables interaction for clarity, and the backend independently enforces the same rule on protected endpoints. Completing a profile emits `oo-ushers:profile-updated`, causing the gate to re-check without requiring a new login.

## 6. Event and staffing logic

Organizations can:

- Create events with date, time, location, gathering point, required usher count, gender requirements, dress code, notes, and per-usher budget.
- Edit or delete eligible events.
- Close events.
- Search ushers and book directly.
- Review applicants and accept or reject applications.
- Assign organization supervisors.
- Request restricted event changes for admin approval.
- View referrals connected to the event.
- Create the event WhatsApp-group workflow when available.

Ushers can:

- Browse open events.
- View event details.
- Apply once to an eligible event.
- See pending, accepted, rejected, and historical applications.
- Submit an excuse for accepted work under backend rules.
- Refer another usher, generate signed invite links for new users, and accept or decline received referrals.

The budget displayed and submitted for an event is the amount per usher.

## 7. Attendance, ratings, and warnings

The organization event detail page supports event-day operations:

- View hired ushers.
- Mark each usher as present, late, absent, or excused according to backend validation.
- Record performance reviews after the applicable event workflow.
- Show rating and reliability information returned by the backend.
- Surface warning/excuse history instead of claiming GPS or background-check functionality.

Payment eligibility uses accepted/hired ushers with a payable attendance status. The backend remains the source of truth.

## 8. Post-event payment and settlement UI

The organization pays after the event through one **Pay all ushers** action.

The settlement UI:

- Loads a server-calculated preview.
- Shows the gross event amount, Paymob collection amount, 5% platform/transfer deduction, 95% usher payout, and cash amount due.
- Starts a Paymob Test checkout through the backend.
- Redirects the organization to Paymob Unified Checkout.
- Polls the backend settlement after Paymob returns to `/provider/payments/result`.
- Returns to the event page after Paymob confirms a successful collection. Company Profile lets the organizer add, view, choose a default, and remove saved Test cards; event checkout can pass an owned saved card token to Paymob so its number need not be entered again.
- Displays collection and payout status.
- Highlights ushers without a supported digital payout method in orange.
- Allows the organization to mark a cash-only usher as paid after handing over cash.

Money rules represented in the UI:

- Each usher earns 95% of the event's per-usher budget.
- 5% is deducted as the platform/transfer fee.
- Digital payout: the gateway collects the full per-usher budget, then the backend pays 95% to the usher.
- Cash payout: the gateway collects the 5% fee only, while the organization pays the remaining 95% to the usher in cash.

Supported usher payout profiles currently include mobile wallets and bank details. Unsupported methods are not presented as automatic-payout options.

## 9. Organization staff

Organization owners can invite staff, update roles, block/unblock members, remove members, and assign supervisors to events. Staff access is scoped by backend authorization; owner-only actions remain unavailable to ordinary members and supervisors.

## 10. Notifications

The frontend reads real backend notifications. It supports listing, marking one notification read, marking all read, and clearing notifications. The previous simulated email-log interface has been removed.

## 11. Internationalization and direction

The language layer supports:

- English (`en`)
- Arabic (`ar`)
- Egyptian Arabic (`ar-eg`)

Arabic modes set `dir="rtl"`; English uses LTR. Language preference is stored in local storage. Egyptian Arabic copy is intentionally conversational while avoiding awkward literal translations. New visible text should always be added to every language dictionary and checked in both directions.

## 12. Theme and responsive design

- Light, dark, and system theme modes are supported.
- Theme preference is persisted.
- Shared color variables keep text readable against page, card, input, modal, and navigation backgrounds.
- Sidebars occupy the full viewport height for usher and organization workspaces.
- Desktop sidebars collapse into mobile navigation.
- Reusable UI controls include focus, hover, disabled, and dark-mode states.
- The public hero uses an event/usher-focused background with a controlled overlay for image visibility and text contrast.
- The staffing calculator, operational checklist, and platform feature sections use the current visual system and actual product capabilities.

## 13. Admin capabilities

The admin UI consumes backend endpoints to:

- View dashboard totals.
- List users, ushers, and organizations.
- Invite users.
- Verify or unverify users.
- Block, unblock, update, or delete users.
- Reset usher excuse counters.
- List and moderate events.
- Resolve organization event-action requests.

## 14. Verification commands

Run from `usher-frontend`:

```bash
npm run lint
npm run build
npm run dev
```

The latest completed verification passed the production build for all application routes. Lint completed without errors; informational warnings may remain.

## 15. Current dependencies and external services

- The backend must be running and connected to PostgreSQL.
- Paymob Test credentials and a public webhook URL are required for a real sandbox collection test.
- Paymob Payouts Sandbox must be activated separately before automatic wallet/bank disbursement works.
- Email verification requires configured backend email credentials.
- Image upload requires configured backend Cloudinary credentials.
- Final production frontend and backend domains are not decided yet.

## 16. Known remaining end-to-end work

- Complete a real Paymob Test card transaction with valid account credentials.
- Confirm wallet visibility/activation in Unified Checkout.
- Obtain and test Paymob Payouts Sandbox credentials for wallet and bank disbursement.
- Verify callback delivery through a public HTTPS backend URL.
- Test stored-card token behavior with an eligible Paymob test integration.
- Test the complete production deployment after final domains are selected.
- Repeat visual QA across representative mobile, tablet, and desktop widths whenever major UI sections change.

## 17. Maintenance rule

Update only affected modular knowledge files with the implementation change, following [AGENTS.md](AGENTS.md) and the shared system-knowledge skill. This historical snapshot does not require regeneration. The backend is authoritative for permissions, payment calculations, attendance eligibility, and stored data.
