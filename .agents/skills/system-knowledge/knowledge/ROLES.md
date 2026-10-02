# Frontend roles

- Backend usher → frontend talent (UserRole.TALENT), /talent workspace.
- Backend organizer → frontend provider (UserRole.PROVIDER), company owner in /provider.
- Backend organizer_member → provider_member; organizer_supervisor → provider_supervisor. Both share /provider; providerProfileId maps providerOwnerId.
- Admin → admin, /admin workspace.
- While an admin acts as an organization owner, /auth/me reports the provider role plus `actingAs` metadata. The provider workspace shows a persistent warning and Stop action; the backend owns the permission switch.
- Public registration offers talent/provider only; staff is invited.

- Event editing is owner-only. Provider users cannot cancel or delete events; the event page offers no cancel, delete, or admin-request controls.
- Funding actions (fund, fund extra spots, confirm team, switch payment mode, release early, retry payout) and the /provider/payments page are owner-only; staff see the event funding card read-only. Every organization role can open the check-in screen and check in an usher (present/late only). Ushers see pay protection, check in themselves, and see their own no-show suspension; admins use /admin/payments.
- Event map editing is owner-only; provider staff can view the full company map. Hired talent can open their event map only when assigned and sees only their own pin. Backend enforces both checks.

Organization owners and staff can manage the shared favorite usher list and use rebook-last-team on owned open events; the backend enforces the organization scope and profile gate. AuthProvider.isProvider includes owner/member/supervisor; isOrganizer means owner only. Layouts check workspace role; owner-only staff/financial controls must not treat isProvider as ownership. Current backend workspace event queries are company-wide even for supervisors.

Profile gate checks talent/owner completeness; it skips staff. Backend checks company owner's completion on protected staff mutations. UI checks are not authoritative authorization.

Sources: `types/index.ts`, `lib/api.ts` (roleMap, normalizeUser), `lib/auth.tsx`, `app/(talent)/layout.tsx`, `app/(provider)/layout.tsx`, `app/(admin)/layout.tsx`, `components/shared/ProfileCompletionGate.tsx`, `components/shared/Sidebar.tsx`.
