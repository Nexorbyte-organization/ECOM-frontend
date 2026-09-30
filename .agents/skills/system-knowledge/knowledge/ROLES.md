# Frontend roles

- Backend usher → frontend talent (UserRole.TALENT), /talent workspace.
- Backend organizer → frontend provider (UserRole.PROVIDER), company owner in /provider.
- Backend organizer_member → provider_member; organizer_supervisor → provider_supervisor. Both share /provider; providerProfileId maps providerOwnerId.
- Admin → admin, /admin workspace.
- While an admin acts as an organization owner, /auth/me reports the provider role plus `actingAs` metadata. The provider workspace shows a persistent warning and Stop action; the backend owns the permission switch.
- Public registration offers talent/provider only; staff is invited.

- Event map editing is owner-only; provider staff can view the full company map. Hired talent can open their event map only when assigned and sees only their own pin. Backend enforces both checks.

AuthProvider.isProvider includes owner/member/supervisor; isOrganizer means owner only. Layouts check workspace role; owner-only staff/financial controls must not treat isProvider as ownership. Current backend workspace event queries are company-wide even for supervisors.

Profile gate checks talent/owner completeness; it skips staff. Backend checks company owner's completion on protected staff mutations. UI checks are not authoritative authorization.

Sources: `types/index.ts`, `lib/api.ts` (roleMap, normalizeUser), `lib/auth.tsx`, `app/(talent)/layout.tsx`, `app/(provider)/layout.tsx`, `app/(admin)/layout.tsx`, `components/shared/ProfileCompletionGate.tsx`, `components/shared/Sidebar.tsx`.
