import { ProviderProfile, TalentProfile } from '@/types';

export function isTalentProfileComplete(profile: TalentProfile | null): boolean {
    if (!profile) return false;

    return Boolean(
        profile.fullName.trim() &&
        profile.photo.trim() &&
        profile.city.trim() &&
        profile.education.trim() &&
        (profile.workCities?.length ?? 0) > 0 &&
        profile.languages.length > 0 &&
        profile.categories.length > 0 &&
        profile.phoneNumber?.trim() &&
        (profile.paymentMethods?.length ?? 0) > 0
    );
}

export function isProviderProfileComplete(profile: ProviderProfile | null): boolean {
    if (!profile) return false;

    return Boolean(
        profile.companyName.trim() &&
        profile.logo.trim() &&
        profile.description.trim() &&
        profile.location.trim() &&
        profile.phone.trim()
    );
}

export const PROFILE_UPDATED_EVENT = 'oo-ushers:profile-updated';

export function announceProfileUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    }
}
