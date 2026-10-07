# Analytics dashboards

## Current behavior

The organization dashboard loads `GET /provider/analytics`; the admin dashboard loads `GET /admin/analytics`. `lib/api.ts` types the shared response, and `components/analytics/AnalyticsDashboard.tsx` renders the role-specific sections. The admin dashboard no longer computes totals from user/event/talent list responses, which may be paginated. Organization staff see the same organization-wide analytics as the owner. Existing organization quick links remain visible, with create-event limited to the owner.

The view shows all-time event totals and status/category breakdowns, application and attendance states, QR check-ins, referrals, reviews, financing/collection/payout status, credit, card refunds, people counts, recent events, and attention counts. Admins also see top organizations by event count and top rated ushers with completed events. The event chart alone covers the current month and previous 11 months. Empty months are filled with zero on the client. Labels distinguish booked event value from collected online money; the latter is paid Paymob advance funding plus paid post-event settlement checkout collections. The value of credit applied to an event is displayed separately to avoid counting it as an online collection. Money is EGP. Backend defines ownership and totals; this component only formats them. Arabic and English labels are provided in the component.

The response has loading, error/retry, and empty states. Recent organization events link to their detail page; recent admin events link to the admin event list because there is no admin event detail route. The backend legacy dashboard endpoints remain available to older clients but are not used on these two pages.

## Source entry points

- `components/analytics/AnalyticsDashboard.tsx`
- `app/(provider)/provider/dashboard/page.tsx`
- `app/(admin)/admin/dashboard/page.tsx`
- `lib/api.ts`

## Change coupling

New backend analytics fields or changed financial definitions require corresponding API types, labels, and this knowledge file. Permission rules are documented in [roles](../ROLES.md).
