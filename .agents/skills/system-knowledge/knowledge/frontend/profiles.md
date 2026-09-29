# Profiles, completion, and talent discovery

## Current behavior
Talent profile edits identity/contact/education/preferences, photo/portfolio, and payout methods. Company profile edits name/logo/description/location/contact, auto-accept preference, and saved-card UI.

Completion helpers require talent fullName/photo/city/education/workCities/languages/categories/phone/paymentMethods; provider requires companyName/logo/description/location/phone. ProfileCompletionGate loads profile state, displays a completion prompt, and listens for oo-ushers:profile-updated after saves.

Sidebar account avatars load the talent's saved profile photo or the organization owner's company logo. They listen for `oo-ushers:profile-updated` to refresh after saves, show a small skeleton during the initial fetch, and retain the default avatar when no photo is available or loading fails. Responses are scoped to the active account and latest request to avoid showing a previous account's image. Staff/admin accounts retain their default avatar.

The frontend gate skips organization staff; backend independently checks the owner's completion for gated mutations. UI completion is not authorization and does not exactly mirror backend rejection of N/A/default avatars.

Provider talent directory/detail and talent directory actions use normalized profiles. Performance badge helper uses completedEventsCount >= 10 and ratingAverage >= 4; it is not proof of identity/background checks.

## Source entry points
- `lib/profile-completion.ts`
- `components/shared/ProfileCompletionGate.tsx`
- `components/shared/Sidebar.tsx`
- `lib/api.ts`
- `types/index.ts`
- `app/(talent)/talent/profile/page.tsx`
- `app/(provider)/provider/profile/page.tsx`
- `app/(provider)/provider/talent/page.tsx`
- `app/(provider)/provider/talent/[id]/page.tsx`

## Change coupling
Completion changes require frontend forms/gates and backend rules to agree. Card integration limitations are in payments.md.
