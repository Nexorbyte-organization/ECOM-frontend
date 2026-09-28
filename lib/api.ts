import { withFeedback } from '@/lib/toast';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AppNotification, Application, ApplicationStatus, Attendance, AttendanceCheckInResult, AttendanceQr, AttendanceStatus,
    AuthResponse, Event, EventMap, EventActionRequest, EventActionRequestType, EventFilters,
    EventSettlement, EventSettlementPreview, EventStatus, OrganizerCard,
    PaginatedResponse, PaymentMethod, ProviderProfile, Referral,
    RegistrationResponse, Review, TalentProfile, TalentSearchFilters, User,
    UserRole,
} from '@/types';
import { isProviderProfileComplete, isTalentProfileComplete } from '@/lib/profile-completion';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };
let refreshRequest: Promise<boolean> | null = null;
const noRefreshPaths = new Set([
    '/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout',
    '/auth/forget-password', '/auth/verify-otp', '/auth/reset-password',
]);

function loggedInUser(): Omit<User, 'password'> | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('usher_user');
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
}

async function apiRequest<T = any>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
    const headers = new Headers(options.headers);
    let body: BodyInit | undefined;
    if (options.body instanceof FormData) body = options.body;
    else if (options.body !== undefined) {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(options.body);
    }
    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, { ...options, headers, body, cache: 'no-store', credentials: 'include' });
    } catch {
        throw new Error(`Could not connect to the OO-Ushers server at ${API_URL}. Make sure the backend is running.`);
    }
    if (response.status === 401 && retry && typeof window !== 'undefined' && !noRefreshPaths.has(path)) {
        refreshRequest ||= fetch(`${API_URL}/auth/refresh`, {
            method: 'POST', credentials: 'include', cache: 'no-store',
        }).then((refresh) => refresh.ok).catch(() => false).finally(() => { refreshRequest = null; });
        if (await refreshRequest) return apiRequest<T>(path, options, false);
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined' && !noRefreshPaths.has(path)) {
            window.dispatchEvent(new CustomEvent('usher:unauthorized'));
        }
        const details = Array.isArray(payload?.details)
            ? payload.details.map((item: any) => typeof item === 'string' ? item : item?.message).filter(Boolean).join(', ')
            : '';
        const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
        throw new Error(details || message || payload?.error || `Request failed (${response.status})`);
    }
    return payload as T;
}

function queryString(values: Record<string, unknown>): string {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });
    return params.size ? `?${params}` : '';
}

function listResponse<T>(payload: any, mapper: (value: any) => T): PaginatedResponse<T> {
    const source = Array.isArray(payload?.data) ? payload.data : [];
    return {
        data: source.map(mapper), total: Number(payload?.total ?? source.length),
        page: Number(payload?.page ?? 1), limit: Number(payload?.limit ?? Math.max(source.length, 1)),
        totalPages: Number(payload?.totalPages ?? (source.length ? 1 : 0)),
    };
}

const roleMap: Record<string, UserRole> = {
    admin: UserRole.ADMIN, usher: UserRole.TALENT, talent: UserRole.TALENT,
    organizer: UserRole.PROVIDER, provider: UserRole.PROVIDER,
    organizer_member: UserRole.PROVIDER_MEMBER, provider_member: UserRole.PROVIDER_MEMBER,
    organizer_supervisor: UserRole.PROVIDER_SUPERVISOR, provider_supervisor: UserRole.PROVIDER_SUPERVISOR,
};

function normalizeUser(value: any): Omit<User, 'password'> {
    return {
        _id: String(value?._id || value?.id || ''), email: value?.email || '',
        role: roleMap[value?.frontendRole || value?.role] || value?.role,
        isVerified: Boolean(value?.isVerified), isBlocked: Boolean(value?.isBlocked),
        createdAt: value?.createdAt || '',
        providerProfileId: value?.providerProfileId || value?.providerOwnerId || undefined,
        fullName: value?.fullName || undefined,
    };
}

function normalizePaymentMethod(value: any): PaymentMethod {
    return {
        ...value, _id: String(value?._id || value?.id || ''),
        provider: value?.provider || value?.issuer || '',
        numberOrDetail: value?.numberOrDetail || value?.mobileNumber || value?.iban || value?.accountNumber || '',
        isDefault: Boolean(value?.isDefault),
    };
}

function normalizeTalent(value: any): TalentProfile {
    const source = value?.user || value || {};
    const portfolio = source.portfolioImages || source.portfolio || [];
    return {
        _id: String(source._id || source.id || ''), userId: String(source.userId || source.id || source._id || ''),
        fullName: source.fullName || '',
        photo: source.portfolioPicture?.public_id === 'default_avatar'
            ? ''
            : source.photo || source.portfolioPicture?.secure_url || '',
        city: source.city || '',
        workCities: source.workCities || [], languages: source.languages || [],
        experienceYears: Number(source.experienceYears ?? source.experience ?? 0),
        education: source.education || '',
        categories: source.categories || source.eventCategories || [], refusedCategories: source.refusedCategories || [],
        portfolioImages: portfolio.map((image: any) => image?.secure_url || image?.url || image),
        availabilityDates: source.availabilityDates || [], reliabilityScore: Number(source.reliabilityScore ?? 100),
        ratingAverage: Number(source.ratingAverage ?? source.rate ?? 0), totalRatings: Number(source.totalRatings ?? 0),
        completedEventsCount: Number(source.completedEventsCount ?? 0), lateExcuseCount: Number(source.lateExcuseCount ?? 0),
        consecutiveGoodEvents: Number(source.consecutiveGoodEvents ?? 0),
        paymentMethods: Array.isArray(source.paymentMethods) ? source.paymentMethods.map(normalizePaymentMethod) : [],
        phoneNumber: source.phoneNumber || source.mobileNumber || undefined, whatsappNumber: source.whatsappNumber || undefined,
    };
}

function normalizeProvider(value: any): ProviderProfile {
    const source = value?.user || value || {};
    const autoAcceptHighRatedTalents = source.autoAcceptHighRatedTalents ?? source.organizationInfo?.autoAcceptHighRatedTalents;
    return {
        _id: String(source._id || source.id || ''), userId: String(source.userId || source.id || source._id || ''),
        companyName: source.companyName || source.fullName || '', logo: source.logo || source.portfolioPicture?.secure_url || '',
        description: source.description || source.organizationInfo?.description || '', location: source.location || source.city || '',
        phone: source.phone || source.mobileNumber || '', website: source.website || source.organizationInfo?.website || '',
        autoAcceptHighRatedTalents: autoAcceptHighRatedTalents === true || autoAcceptHighRatedTalents === 'true',
    };
}

function normalizeEvent(value: any): Event {
    return {
        ...value, _id: String(value?._id || value?.id || ''),
        providerId: String(value?.providerId || value?.organizerId || ''),
        photo: typeof value?.photo === 'object' ? value.photo?.secure_url || value.photo?.url || '' : value?.photo || '',
        hiredTalents: value?.hiredTalents || [], supervisorIds: value?.supervisorIds || (value?.supervisorId ? [value.supervisorId] : []),
        status: value?.status || EventStatus.OPEN, genderPreference: value?.genderPreference || 'any', createdAt: value?.createdAt || '',
    } as Event;
}

function normalizeApplication(value: any): Application {
    return {
        _id: String(value?._id || value?.id || ''), eventId: String(value?.eventId || value?.event?.id || value?.event?._id || ''),
        talentId: String(value?.talentId || value?.usherId || ''), status: value?.status, isDirect: Boolean(value?.isDirect),
        referredBy: value?.referredBy || undefined, appliedAt: value?.appliedAt || value?.createdAt || '',
    };
}

function normalizeAttendance(value: any): Attendance {
    return {
        _id: String(value?._id || value?.id || ''), eventId: String(value?.eventId || ''),
        talentId: String(value?.talentId || ''), status: value?.status,
        checkInTime: value?.checkInTime || null, checkOutTime: value?.checkOutTime || null,
    };
}

function normalizeReview(value: any): Review {
    return {
        _id: String(value?._id || value?.id || ''), eventId: String(value?.eventId || value?.event?.id || ''),
        reviewerId: String(value?.reviewerId || ''), reviewedUserId: String(value?.reviewedUserId || value?.talentId || ''),
        rating: Number(value?.rating || 0), comment: value?.comment || '', createdAt: value?.createdAt || '',
    };
}

function normalizeReferral(value: any): Referral {
    return {
        _id: String(value?._id || value?.id || ''), eventId: String(value?.eventId || ''),
        referrerTalentId: String(value?.referrerTalentId || ''), referredTalentId: String(value?.referredTalentId || ''),
        status: value?.status, createdAt: value?.createdAt || '',
    };
}

function normalizeNotification(value: any): AppNotification {
    return {
        _id: String(value?._id || value?.id || ''), userId: String(value?.userId || ''), title: value?.title || '',
        message: value?.message || '', type: value?.type || 'info', isRead: Boolean(value?.isRead),
        createdAt: value?.createdAt || '', link: value?.link || undefined,
    };
}

function normalizeSettlement(value: any): EventSettlement {
    return {
        ...value, _id: String(value?._id || value?.id || ''), eventId: String(value?.eventId || ''),
        organizerId: String(value?.organizerId || ''), testMode: true,
        lines: (value?.lines || []).map((line: any) => ({
            ...line, _id: String(line?._id || line?.id || ''), talentId: String(line?.talentId || ''),
            talent: normalizeTalent(line?.talent || { id: line?.talentId, fullName: line?.talentName, photo: line?.talentPhoto }),
        })),
    } as EventSettlement;
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

// Admin
export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const payload = await apiRequest('/admin/users?limit=100');
    return (payload.data || []).map(normalizeUser);
}
export async function getAllEvents(): Promise<Event[]> {
    const payload = await apiRequest('/admin/events?limit=100'); return (payload.data || []).map(normalizeEvent);
}
export async function getAllTalentProfiles(): Promise<TalentProfile[]> {
    const payload = await apiRequest('/admin/ushers?limit=100'); return (payload.data || []).map(normalizeTalent);
}
export async function getAllProviderProfiles(): Promise<ProviderProfile[]> {
    const payload = await apiRequest('/admin/organizers?limit=100'); return (payload.data || []).map(normalizeProvider);
}
async function adminBlockUserAction(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}/block`, { method: 'PATCH' }); }
async function adminUnblockUserAction(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}/unblock`, { method: 'PATCH' }); }
async function adminDeleteUserAction(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }); }
async function adminUpdateEventStatusAction(eventId: string, status: EventStatus): Promise<Event> {
    const payload = await apiRequest(`/admin/events/${eventId}/status`, { method: 'PATCH', body: { status } }); return normalizeEvent(payload.data);
}
async function adminResetLateExcusesAction(talentId: string): Promise<void> { await apiRequest(`/admin/ushers/${talentId}/reset-excuses`, { method: 'POST' }); }
async function adminDeleteEventAction(eventId: string): Promise<void> { await apiRequest(`/admin/events/${eventId}`, { method: 'DELETE' }); }
async function adminVerifyUserAction(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}/verify`, { method: 'PATCH' }); }
async function adminUnverifyUserAction(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}/unverify`, { method: 'PATCH' }); }
async function adminInviteUserAction(data: {
    email: string; password?: string; role: UserRole; fullName?: string; city?: string; companyName?: string; providerProfileId?: string;
}): Promise<User> {
    const payload = await apiRequest('/admin/users', { method: 'POST', body: data }); return normalizeUser(payload.data) as User;
}

// Auth
async function loginAction(email: string, password: string): Promise<AuthResponse> {
    const payload = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    const response = payload.data || payload;
    return { token: '', user: normalizeUser(response.user || payload.user) };
}
async function registerAction(email: string, password: string, role: 'talent' | 'provider'): Promise<RegistrationResponse> {
    const payload = await apiRequest('/auth/signup', { method: 'POST', body: { email, password, role: role === 'talent' ? 'usher' : 'organizer' } });
    return { user: normalizeUser(payload.data), message: payload.message || 'Account created', verificationRequired: true };
}
export async function getCurrentUser(): Promise<Omit<User, 'password'>> {
    const payload = await apiRequest('/auth/me'); return normalizeUser(payload.data);
}
export async function logoutSession(): Promise<void> {
    await apiRequest('/auth/logout', { method: 'POST' }, false);
}
async function forgotPasswordAction(email: string): Promise<string> {
    const payload = await apiRequest('/auth/forget-password', { method: 'POST', body: { email } }, false);
    return payload.message;
}
async function verifyResetOtpAction(email: string, otp: string): Promise<string> {
    const payload = await apiRequest('/auth/verify-otp', { method: 'POST', body: { email, otp } }, false);
    return payload.data?.resetToken || payload.resetToken;
}
async function resetPasswordAction(resetToken: string, newPassword: string): Promise<void> {
    await apiRequest('/auth/reset-password', { method: 'POST', body: { resetToken, newPassword } }, false);
}
export function isVerifiedTalent(profile: TalentProfile): boolean { return profile.completedEventsCount >= 10 && profile.ratingAverage >= 4; }

// Profiles
export async function getTalentProfile(id: string): Promise<TalentProfile | null> {
    try {
        const own = loggedInUser()?._id === id;
        const payload = await apiRequest(own ? `/talent/${id}` : `/talent/profile/${id}`);
        return normalizeTalent(payload.data);
    } catch (error) {
        if (error instanceof Error && /not found/i.test(error.message)) return null;
        throw error;
    }
}
export async function getTalentProfileByUserId(userId: string): Promise<TalentProfile | null> { return getTalentProfile(userId); }
async function updateTalentProfileAction(userId: string, data: Partial<TalentProfile>): Promise<TalentProfile> {
    const { photo, ...profileData } = data;
    let profile: TalentProfile;
    if (Object.keys(profileData).length) {
        const payload = await apiRequest('/talent/profile/update', { method: 'PUT', body: profileData }); profile = normalizeTalent(payload.data);
    } else profile = (await getTalentProfileByUserId(userId)) as TalentProfile;
    if (photo?.startsWith('data:')) {
        const form = new FormData(); form.append('picture', await dataUrlToFile(photo, 'profile-photo.jpg'));
        await apiRequest('/talent/profile/picture', { method: 'PATCH', body: form }); profile = { ...profile, photo };
    }
    return profile;
}
async function uploadTalentPortfolioImageAction(file: File): Promise<string[]> {
    const form = new FormData(); form.append('image', file);
    const payload = await apiRequest('/talent/profile/portfolio', { method: 'POST', body: form });
    return (payload.data || []).map((image: any) => image?.secure_url || image?.url || image);
}
async function deleteTalentPortfolioImageAction(index: number): Promise<string[]> {
    const payload = await apiRequest(`/talent/profile/portfolio/${index}`, { method: 'DELETE' });
    return (payload.data || []).map((image: any) => image?.secure_url || image?.url || image);
}
async function addPaymentMethodAction(
    _userId: string, providerOrMethod: string | Omit<PaymentMethod, '_id' | 'isDefault'>, numberOrDetail?: string,
): Promise<PaymentMethod[]> {
    const body = typeof providerOrMethod === 'string' ? { provider: providerOrMethod, numberOrDetail } : providerOrMethod;
    const payload = await apiRequest('/talent/profile/payment-methods', { method: 'POST', body });
    return (payload.data || []).map(normalizePaymentMethod);
}
async function deletePaymentMethodAction(_userId: string, methodId: string): Promise<PaymentMethod[]> {
    const payload = await apiRequest(`/talent/profile/payment-methods/${methodId}`, { method: 'DELETE' }); return (payload.data || []).map(normalizePaymentMethod);
}
async function setDefaultPaymentMethodAction(_userId: string, methodId: string): Promise<PaymentMethod[]> {
    const payload = await apiRequest(`/talent/profile/payment-methods/${methodId}/default`, { method: 'PATCH' }); return (payload.data || []).map(normalizePaymentMethod);
}
export async function searchTalents(filters: TalentSearchFilters): Promise<PaginatedResponse<TalentProfile>> {
    const payload = await apiRequest(`/provider/talents${queryString({ ...filters, limit: filters.limit || 12 })}`); return listResponse(payload, normalizeTalent);
}
export async function getProviderProfile(_id: string): Promise<ProviderProfile | null> {
    try { const payload = await apiRequest('/provider/profile'); return normalizeProvider(payload.data); }
    catch (error) { if (error instanceof Error && /not found/i.test(error.message)) return null; throw error; }
}
export async function getProviderProfileByUserId(userId: string): Promise<ProviderProfile | null> { return getProviderProfile(userId); }
async function updateProviderProfileAction(userId: string, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
    const { logo, ...profileData } = data;
    let profile: ProviderProfile;
    if (Object.keys(profileData).length) {
        const payload = await apiRequest('/provider/profile', { method: 'PUT', body: profileData }); profile = normalizeProvider(payload.data);
    } else profile = (await getProviderProfileByUserId(userId)) as ProviderProfile;
    if (logo?.startsWith('data:')) {
        const form = new FormData(); form.append('logo', await dataUrlToFile(logo, 'company-logo.jpg'));
        await apiRequest('/provider/profile/logo', { method: 'PATCH', body: form }); profile = { ...profile, logo };
    }
    return profile;
}

// Events
async function createEventAction(data: Omit<Event, '_id' | 'createdAt' | 'hiredTalents' | 'status'>): Promise<Event> {
    const { providerId: _providerId, photo, ...body } = data;
    const payload = await apiRequest('/provider/events', { method: 'POST', body });
    let event = normalizeEvent(payload.data);
    if (photo?.startsWith('data:')) event = await uploadEventPhotoAction(event._id, await dataUrlToFile(photo, 'event-photo.jpg'));
    return event;
}
export async function getEvent(id: string): Promise<Event | null> {
    const user = loggedInUser();
    try {
        if (user?.role === UserRole.ADMIN) {
            const events = await getAllEvents(); return events.find((event) => event._id === id) || null;
        }
        const prefix = user?.role === UserRole.TALENT ? '/talent/events' : '/provider/events';
        const payload = await apiRequest(`${prefix}/${id}`); return normalizeEvent(payload.data);
    } catch (error) { if (error instanceof Error && /not found/i.test(error.message)) return null; throw error; }
}
export async function getEventMap(eventId: string, role: 'provider' | 'talent'): Promise<EventMap> {
    const payload = await apiRequest(`/` + role + `/events/${eventId}/map`);
    return payload.data;
}
export async function uploadEventMap(eventId: string, file: File): Promise<EventMap> {
    const form = new FormData(); form.append('map', file);
    const payload = await apiRequest(`/provider/events/${eventId}/map/image`, { method: 'PATCH', body: form });
    return payload.data;
}
export async function createEventMapPin(eventId: string, pin: { name: string; x: number; y: number }): Promise<EventMap> {
    const payload = await apiRequest(`/provider/events/${eventId}/map/pins`, { method: 'POST', body: pin });
    return payload.data;
}
export async function updateEventMapPin(eventId: string, pinId: string, changes: { name?: string; x?: number; y?: number; usherIds?: string[] }): Promise<EventMap> {
    const payload = await apiRequest(`/provider/events/${eventId}/map/pins/${pinId}`, { method: 'PATCH', body: changes });
    return payload.data;
}
export async function deleteEventMapPin(eventId: string, pinId: string): Promise<EventMap> {
    const payload = await apiRequest(`/provider/events/${eventId}/map/pins/${pinId}`, { method: 'DELETE' });
    return payload.data;
}
export async function getProviderEvents(_providerId: string, filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    const payload = await apiRequest(`/provider/events${queryString({ ...filters, limit: filters?.limit || 100 })}`); return listResponse(payload, normalizeEvent);
}
export async function getOpenEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    const payload = await apiRequest(`/talent/events/browse${queryString({ ...filters, limit: filters?.limit || 100 })}`); return listResponse(payload, normalizeEvent);
}
async function updateEventAction(id: string, data: Partial<Event>): Promise<Event> {
    const { photo, ...body } = data;
    const payload = await apiRequest(`/provider/events/${id}`, { method: 'PUT', body });
    let event = normalizeEvent(payload.data);
    if (photo?.startsWith('data:')) event = await uploadEventPhotoAction(id, await dataUrlToFile(photo, 'event-photo.jpg'));
    return event;
}
async function uploadEventPhotoAction(eventId: string, file: File): Promise<Event> {
    const form = new FormData(); form.append('photo', file);
    const payload = await apiRequest(`/provider/events/${eventId}/photo`, { method: 'PATCH', body: form });
    return normalizeEvent(payload.data);
}
async function deleteEventAction(id: string): Promise<void> { await apiRequest(`/provider/events/${id}`, { method: 'DELETE' }); }
async function generateEventAttendanceQrAction(eventId: string): Promise<AttendanceQr> {
    const payload = await apiRequest(`/provider/events/${eventId}/attendance-qr`, { method: 'POST' });
    return payload.data;
}
export async function getEventAttendanceQr(eventId: string): Promise<AttendanceQr> {
    const payload = await apiRequest(`/provider/events/${eventId}/attendance-qr`);
    return payload.data;
}

// Applications
async function applyToEventAction(eventId: string, _talentId: string): Promise<Application> {
    const payload = await apiRequest('/talent/events/apply', { method: 'POST', body: { eventId } }); return normalizeApplication(payload.data);
}
async function directBookTalentAction(eventId: string, talentId: string): Promise<Application> {
    const payload = await apiRequest('/provider/direct-book', { method: 'POST', body: { eventId, talentId } }); return normalizeApplication(payload.data);
}
export async function getEventApplicants(eventId: string): Promise<(Application & { talent: TalentProfile })[]> {
    const payload = await apiRequest(`/provider/events/${eventId}/applicants`);
    return (payload.data || []).map((value: any) => ({ ...normalizeApplication(value), talent: normalizeTalent(value.talent) }));
}
export async function getTalentApplications(_talentId: string): Promise<(Application & { event: Event })[]> {
    const payload = await apiRequest('/talent/applications/my?limit=100');
    return (payload.data || []).map((value: any) => ({ ...normalizeApplication(value), event: normalizeEvent(value.event) }));
}
async function updateApplicationStatusAction(appId: string, status: ApplicationStatus): Promise<Application> {
    const payload = await apiRequest(`/provider/applications/${appId}/status`, { method: 'PATCH', body: { status } }); return normalizeApplication(payload.data);
}

// Attendance and reviews
export async function getEventAttendance(eventId: string): Promise<(Attendance & { talent: TalentProfile })[]> {
    const payload = await apiRequest(`/provider/events/${eventId}/attendance`);
    return (payload.data || []).map((value: any) => ({ ...normalizeAttendance(value), talent: normalizeTalent(value.talent) }));
}
async function markAttendanceAction(eventId: string, talentId: string, status: AttendanceStatus): Promise<Attendance> {
    const payload = await apiRequest(`/provider/events/${eventId}/attendance`, { method: 'POST', body: { talentId, status } }); return normalizeAttendance(payload.data);
}
async function checkInWithAttendanceQrAction(token: string): Promise<AttendanceCheckInResult> {
    const payload = await apiRequest('/talent/attendance/check-in', { method: 'POST', body: { token } });
    return {
        attendance: normalizeAttendance(payload.data.attendance),
        event: normalizeEvent(payload.data.event),
        alreadyCheckedIn: Boolean(payload.data.alreadyCheckedIn),
    };
}
async function excuseFromEventAction(talentId: string, eventId: string): Promise<{ isLate: boolean; lateExcuseCount: number }> {
    const applications = await getTalentApplications(talentId);
    const application = applications.find((item) => item.eventId === eventId && item.status === ApplicationStatus.ACCEPTED);
    if (!application) throw new Error('No accepted application found for this event');
    const payload = await apiRequest(`/talent/applications/${application._id}/excuse`, { method: 'PATCH' });
    return { isLate: Boolean(payload.data?.isLateExcuse), lateExcuseCount: Number(payload.data?.lateExcuseCount || 0) };
}
async function submitReviewAction(data: {
    eventId: string; reviewerId: string; reviewedUserId: string; rating: number; comment: string;
}): Promise<Review> {
    const payload = await apiRequest(`/provider/events/${data.eventId}/reviews`, {
        method: 'POST', body: { talentId: data.reviewedUserId, rating: data.rating, comment: data.comment },
    }); return normalizeReview(payload.data);
}
export async function getEventReviews(eventId: string): Promise<Review[]> {
    const payload = await apiRequest(`/provider/events/${eventId}/reviews`); return (payload.data || []).map(normalizeReview);
}
export async function getTalentEventHistory(talentId: string): Promise<{
    event: Event; application: Application; attendance: Attendance | null; review: Review | null;
}[]> {
    const user = loggedInUser();
    if (user?.role === UserRole.TALENT && user._id === talentId) {
        const payload = await apiRequest('/talent/events/history');
        return (payload.data || []).map((value: any) => ({
            event: normalizeEvent(value.event),
            application: normalizeApplication(value.application || { id: `history-${value.event?.id}`, eventId: value.event?.id, talentId, status: value.applicationStatus || 'accepted' }),
            attendance: value.attendance ? normalizeAttendance(value.attendance) : value.attendanceStatus ? normalizeAttendance({ eventId: value.event?.id, talentId, status: value.attendanceStatus }) : null,
            review: value.review ? normalizeReview(value.review) : value.rating ? normalizeReview({ eventId: value.event?.id, reviewedUserId: talentId, rating: value.rating, comment: value.comment }) : null,
        }));
    }
    const payload = await apiRequest(`/talent/profile/${talentId}`);
    return (payload.data?.eventHistory || []).map((value: any) => ({
        event: normalizeEvent(value.event), application: normalizeApplication({ id: `history-${value.event?.id}`, eventId: value.event?.id, talentId, status: value.applicationStatus || 'accepted' }),
        attendance: value.attendanceStatus ? normalizeAttendance({ eventId: value.event?.id, talentId, status: value.attendanceStatus }) : null,
        review: value.rating ? normalizeReview({ eventId: value.event?.id, reviewedUserId: talentId, rating: value.rating, comment: value.comment }) : null,
    }));
}
export async function getReviewsForTalent(talentId: string): Promise<(Review & { event: Event })[]> {
    const payload = await apiRequest(`/talent/profile/${talentId}/reviews`);
    return (payload.data || []).map((value: any) => ({ ...normalizeReview(value), event: normalizeEvent(value.event) }));
}

// Dashboards
export interface TalentDashboardStats {
    reliabilityScore: number;
    ratingAverage: number;
    totalRatings: number;
    upcomingEventsCount: number;
    completedEventsCount: number;
    pendingApplications: number;
    acceptedApplications: number;
    upcomingEvents: Event[];
}

export interface ProviderDashboardStats {
    totalEvents: number;
    openEvents: number;
    confirmedEvents: number;
    completedEvents: number;
    completedEventsCount: number;
    activeEventsCount: number;
    totalHired: number;
    pendingApplicationsCount: number;
    activeEvents: Event[];
    recentEvents: Event[];
}

export async function getTalentDashboardStats(_talentId: string): Promise<TalentDashboardStats> {
    const payload = await apiRequest('/talent/dashboard');
    return { ...payload.data, upcomingEvents: (payload.data?.upcomingEvents || []).map(normalizeEvent) } as TalentDashboardStats;
}
export async function getProviderDashboardStats(_providerId: string): Promise<ProviderDashboardStats> {
    const payload = await apiRequest('/provider/dashboard');
    return {
        ...payload.data, completedEventsCount: payload.data?.completedEvents,
        activeEvents: (payload.data?.activeEvents || []).map(normalizeEvent), recentEvents: (payload.data?.recentEvents || []).map(normalizeEvent),
    } as ProviderDashboardStats;
}

// Referrals
async function referTalentToEventAction(eventId: string, _referrerTalentId: string, referredTalentId: string): Promise<Referral> {
    const payload = await apiRequest('/talent/refer', { method: 'POST', body: { eventId, referredTalentId } }); return normalizeReferral(payload.data);
}
async function createReferralInviteAction(eventId: string): Promise<string> {
    const payload = await apiRequest('/talent/referral-invites', { method: 'POST', body: { eventId } });
    return payload.data.token;
}
export async function getReferralInvite(token: string): Promise<{ event: Event; referrer: TalentProfile }> {
    const payload = await apiRequest(`/auth/referral-invites/${encodeURIComponent(token)}`, {}, false);
    return { event: normalizeEvent(payload.data.event), referrer: normalizeTalent(payload.data.referrer) };
}
async function redeemReferralInviteAction(token: string): Promise<Referral> {
    const payload = await apiRequest(`/talent/referral-invites/${encodeURIComponent(token)}/redeem`, { method: 'POST' });
    return normalizeReferral(payload.data);
}
export async function getTalentPendingReferrals(_talentId: string): Promise<(Referral & { event: Event; referrer: TalentProfile })[]> {
    const payload = await apiRequest('/talent/referrals/pending');
    return (payload.data || []).map((value: any) => ({ ...normalizeReferral(value), event: normalizeEvent(value.event), referrer: normalizeTalent(value.referrer) }));
}
async function acceptReferralAction(referralId: string): Promise<Application> {
    const payload = await apiRequest(`/talent/referrals/${referralId}/accept`, { method: 'PATCH' }); return normalizeApplication(payload.data);
}
async function declineReferralAction(referralId: string): Promise<void> { await apiRequest(`/talent/referrals/${referralId}/decline`, { method: 'PATCH' }); }
export async function getEventReferrals(eventId: string): Promise<(Referral & { referrer: TalentProfile; referred: TalentProfile })[]> {
    const payload = await apiRequest(`/provider/events/${eventId}/referrals`);
    return (payload.data || []).map((value: any) => ({
        ...normalizeReferral(value), referrer: normalizeTalent(value.referrer), referred: normalizeTalent(value.referred),
    }));
}
export async function getAllTalents(): Promise<TalentProfile[]> {
    const path = loggedInUser()?.role === UserRole.TALENT ? '/talent/talents?limit=100' : '/provider/talents?limit=100';
    const payload = await apiRequest(path); return (payload.data || []).map(normalizeTalent);
}

// Staff
async function inviteStaffMemberAction(
    fullName: string, email: string, password = 'member123', role: UserRole = UserRole.PROVIDER_MEMBER,
): Promise<User> {
    const payload = await apiRequest('/provider/staff', { method: 'POST', body: { fullName, email, password, role } }); return normalizeUser(payload.data) as User;
}
async function providerBlockStaffAction(memberUserId: string): Promise<void> { await apiRequest(`/provider/staff/${memberUserId}/block`, { method: 'PATCH' }); }
async function providerUnblockStaffAction(memberUserId: string): Promise<void> { await apiRequest(`/provider/staff/${memberUserId}/unblock`, { method: 'PATCH' }); }
async function providerUpdateStaffAction(
    memberUserId: string, data: { fullName?: string; email?: string; password?: string; role?: UserRole },
): Promise<User> {
    const payload = await apiRequest(`/provider/staff/${memberUserId}`, { method: 'PUT', body: data }); return normalizeUser(payload.data) as User;
}
export async function getStaffMembers(): Promise<Omit<User, 'password'>[]> {
    const payload = await apiRequest('/provider/staff'); return (payload.data || []).map(normalizeUser);
}
async function removeStaffMemberAction(memberUserId: string): Promise<void> { await apiRequest(`/provider/staff/${memberUserId}`, { method: 'DELETE' }); }
async function assignSupervisorToEventAction(eventId: string, supervisorUserId: string, add: boolean): Promise<Event> {
    const payload = await apiRequest(`/provider/events/${eventId}/supervisor`, { method: 'PATCH', body: { supervisorUserId, add } }); return normalizeEvent(payload.data);
}

// Event action requests and WhatsApp
function normalizeEventActionRequest(value: any): EventActionRequest {
    return {
        _id: String(value?._id || value?.id || ''), eventId: String(value?.eventId || ''),
        providerId: String(value?.providerId || value?.organizerId || ''), requestType: value?.requestType,
        reason: value?.reason || undefined, status: value?.status, createdAt: value?.createdAt || '',
    };
}
async function requestEventActionAction(eventId: string, requestType: EventActionRequestType, reason?: string): Promise<EventActionRequest> {
    const payload = await apiRequest(`/provider/events/${eventId}/action-requests`, { method: 'POST', body: { requestType, reason } }); return normalizeEventActionRequest(payload.data);
}
export async function getPendingEventActionRequests(): Promise<(EventActionRequest & { event: Event; provider: ProviderProfile })[]> {
    const payload = await apiRequest('/admin/event-action-requests');
    return (payload.data || []).map((value: any) => ({
        ...normalizeEventActionRequest(value), event: normalizeEvent(value.event), provider: normalizeProvider(value.provider || value.organizer),
    }));
}
async function resolveEventActionRequestAction(requestId: string, decision: 'approved' | 'rejected'): Promise<EventActionRequest> {
    const payload = await apiRequest(`/admin/event-action-requests/${requestId}`, { method: 'PATCH', body: { decision, status: decision } });
    return normalizeEventActionRequest(payload.data);
}
export interface CreateGroupResult {
    groupLink: string; groupId: string; includedTalents: TalentProfile[]; excludedNoPhone: TalentProfile[];
}
async function createEventWhatsAppGroupAction(eventId: string): Promise<CreateGroupResult> {
    const payload = await apiRequest(`/provider/events/${eventId}/whatsapp-group`, { method: 'POST' }); const data = payload.data || payload;
    return {
        groupLink: data.groupLink, groupId: data.groupId,
        includedTalents: (data.includedTalents || []).map(normalizeTalent), excludedNoPhone: (data.excludedNoPhone || []).map(normalizeTalent),
    };
}

// Notifications
export async function getNotifications(_userId: string): Promise<AppNotification[]> {
    const payload = await apiRequest('/notifications'); return (payload.data || []).map(normalizeNotification);
}
export async function markNotificationAsRead(notificationId: string): Promise<void> { await apiRequest(`/notifications/${notificationId}/read`, { method: 'PATCH' }); }
async function markAllNotificationsAsReadAction(_userId: string): Promise<void> { await apiRequest('/notifications/read-all', { method: 'PATCH' }); }
async function clearAllNotificationsAction(_userId: string): Promise<void> { await apiRequest('/notifications', { method: 'DELETE' }); }

// Paymob test settlements
export async function getEventSettlementPreview(eventId: string): Promise<EventSettlementPreview> {
    const payload = await apiRequest(`/provider/events/${eventId}/settlement-preview`);
    return {
        ...payload.data,
        lines: (payload.data?.lines || []).map((line: any) => ({
            ...line,
            grossAmount: Number(line.grossAmount ?? line.grossAmountCents / 100),
            collectionAmount: Number(line.collectionAmount ?? line.collectionAmountCents / 100),
            platformFee: Number(line.platformFee ?? line.platformFeeCents / 100),
            usherAmount: Number(line.usherAmount ?? line.usherAmountCents / 100),
        })),
    };
}
async function createEventSettlementAction(eventId: string, cardId?: string): Promise<EventSettlement> {
    const payload = await apiRequest(`/provider/events/${eventId}/settlement`, { method: 'POST', body: cardId ? { cardId } : {} }); return normalizeSettlement(payload.data);
}
export async function getEventSettlement(eventId: string): Promise<EventSettlement | null> {
    try {
        const payload = await apiRequest(`/provider/events/${eventId}/settlement`); return payload.data ? normalizeSettlement(payload.data) : null;
    } catch (error) { if (error instanceof Error && /not found|no settlement/i.test(error.message)) return null; throw error; }
}
export async function getSettlement(settlementId: string): Promise<EventSettlement> {
    const payload = await apiRequest(`/payments/${settlementId}`); return normalizeSettlement(payload.data);
}
async function markCashSettlementLinePaidAction(settlementId: string, lineId: string): Promise<EventSettlement> {
    const payload = await apiRequest(`/provider/settlements/${settlementId}/lines/${lineId}/cash-paid`, { method: 'PATCH' }); return normalizeSettlement(payload.data);
}
export async function getOrganizerCards(): Promise<OrganizerCard[]> {
    const payload = await apiRequest('/provider/payment-cards'); return payload.data || [];
}
async function startOrganizerCardEnrollmentAction(): Promise<{ id: string; checkoutUrl: string }> {
    const payload = await apiRequest('/provider/payment-cards/enrollments', { method: 'POST' }); return payload.data;
}
export async function getOrganizerCardEnrollment(enrollmentId: string): Promise<'pending' | 'completed' | 'failed'> {
    const payload = await apiRequest(`/provider/payment-cards/enrollments/${enrollmentId}`); return payload.data.status;
}
async function setDefaultOrganizerCardAction(cardId: string): Promise<void> {
    await apiRequest(`/provider/payment-cards/${cardId}/default`, { method: 'PATCH' });
}
async function removeOrganizerCardAction(cardId: string): Promise<void> { await apiRequest(`/provider/payment-cards/${cardId}`, { method: 'DELETE' }); }

export { API_URL };
export function canCreateOrBook(profile: ProviderProfile | null): boolean { return isProviderProfileComplete(profile); }
export function canApply(profile: TalentProfile | null): boolean { return isTalentProfileComplete(profile); }

// Action feedback is emitted once per logical operation; data reads remain silent.
export const updateTalentProfile = withFeedback(updateTalentProfileAction, { en: 'Profile saved.', ar: 'تم حفظ الملف الشخصي.', 'ar-eg': 'تم حفظ الملف الشخصي.' });
export const updateProviderProfile = withFeedback(updateProviderProfileAction, { en: 'Profile saved.', ar: 'تم حفظ الملف الشخصي.', 'ar-eg': 'تم حفظ الملف الشخصي.' });
export const uploadTalentPortfolioImage = withFeedback(uploadTalentPortfolioImageAction, { en: 'Image uploaded.', ar: 'تم رفع الصورة.', 'ar-eg': 'تم رفع الصورة.' });
export const uploadEventPhoto = withFeedback(uploadEventPhotoAction, { en: 'Image uploaded.', ar: 'تم رفع الصورة.', 'ar-eg': 'تم رفع الصورة.' });
export const deleteTalentPortfolioImage = withFeedback(deleteTalentPortfolioImageAction, { en: 'Image removed.', ar: 'تم حذف الصورة.', 'ar-eg': 'تم حذف الصورة.' });
export const addPaymentMethod = withFeedback(addPaymentMethodAction, { en: 'Payment method added.', ar: 'تمت إضافة وسيلة الدفع.', 'ar-eg': 'تمت إضافة وسيلة الدفع.' });
export const deletePaymentMethod = withFeedback(deletePaymentMethodAction, { en: 'Payment method removed.', ar: 'تم حذف وسيلة الدفع.', 'ar-eg': 'تم حذف وسيلة الدفع.' });
export const setDefaultPaymentMethod = withFeedback(setDefaultPaymentMethodAction, { en: 'Default payment method updated.', ar: 'تم تحديث وسيلة الدفع الافتراضية.', 'ar-eg': 'تم تحديث وسيلة الدفع الافتراضية.' });
export const setDefaultOrganizerCard = withFeedback(setDefaultOrganizerCardAction, { en: 'Default payment method updated.', ar: 'تم تحديث وسيلة الدفع الافتراضية.', 'ar-eg': 'تم تحديث وسيلة الدفع الافتراضية.' });
export const createEvent = withFeedback(createEventAction, { en: 'Event created.', ar: 'تم إنشاء الفعالية.', 'ar-eg': 'تم إنشاء الفعالية.' });
export const updateEvent = withFeedback(updateEventAction, { en: 'Event updated.', ar: 'تم تحديث الفعالية.', 'ar-eg': 'تم تحديث الفعالية.' });
export const adminUpdateEventStatus = withFeedback(adminUpdateEventStatusAction, { en: 'Event updated.', ar: 'تم تحديث الفعالية.', 'ar-eg': 'تم تحديث الفعالية.' });
export const deleteEvent = withFeedback(deleteEventAction, { en: 'Event deleted.', ar: 'تم حذف الفعالية.', 'ar-eg': 'تم حذف الفعالية.' });
export const adminDeleteEvent = withFeedback(adminDeleteEventAction, { en: 'Event deleted.', ar: 'تم حذف الفعالية.', 'ar-eg': 'تم حذف الفعالية.' });
export const applyToEvent = withFeedback(applyToEventAction, { en: 'Application submitted.', ar: 'تم إرسال طلب التقديم.', 'ar-eg': 'تم إرسال طلب التقديم.' });
export const directBookTalent = withFeedback(directBookTalentAction, { en: 'Booking request sent.', ar: 'تم إرسال طلب الحجز.', 'ar-eg': 'تم إرسال طلب الحجز.' });
export const updateApplicationStatus = withFeedback(updateApplicationStatusAction, { en: 'Application status updated.', ar: 'تم تحديث حالة الطلب.', 'ar-eg': 'تم تحديث حالة الطلب.' });
export const markAttendance = withFeedback(markAttendanceAction, { en: 'Attendance updated.', ar: 'تم تحديث الحضور.', 'ar-eg': 'تم تحديث الحضور.' });
export const checkInWithAttendanceQr = withFeedback(checkInWithAttendanceQrAction, { en: 'Attendance confirmed.', ar: 'تم تأكيد الحضور.', 'ar-eg': 'تم تأكيد الحضور.' });
export const excuseFromEvent = withFeedback(excuseFromEventAction, { en: 'Excuse submitted.', ar: 'تم إرسال الاعتذار.', 'ar-eg': 'تم إرسال الاعتذار.' });
export const submitReview = withFeedback(submitReviewAction, { en: 'Review submitted.', ar: 'تم إرسال التقييم.', 'ar-eg': 'تم إرسال التقييم.' });
export const referTalentToEvent = withFeedback(referTalentToEventAction, { en: 'Referral sent.', ar: 'تم إرسال الترشيح.', 'ar-eg': 'تم إرسال الترشيح.' });
export const redeemReferralInvite = withFeedback(redeemReferralInviteAction, { en: 'Referral sent.', ar: 'تم إرسال الترشيح.', 'ar-eg': 'تم إرسال الترشيح.' });
export const createReferralInvite = withFeedback(createReferralInviteAction, { en: 'Invite link created.', ar: 'تم إنشاء رابط الدعوة.', 'ar-eg': 'تم إنشاء رابط الدعوة.' });
export const acceptReferral = withFeedback(acceptReferralAction, { en: 'Referral accepted.', ar: 'تم قبول الترشيح.', 'ar-eg': 'تم قبول الترشيح.' });
export const declineReferral = withFeedback(declineReferralAction, { en: 'Referral declined.', ar: 'تم رفض الترشيح.', 'ar-eg': 'تم رفض الترشيح.' });
export const inviteStaffMember = withFeedback(inviteStaffMemberAction, { en: 'Staff account created.', ar: 'تم إنشاء حساب الموظف.', 'ar-eg': 'تم إنشاء حساب الموظف.' });
export const adminInviteUser = withFeedback(adminInviteUserAction, { en: 'Staff account created.', ar: 'تم إنشاء حساب الموظف.', 'ar-eg': 'تم إنشاء حساب الموظف.' });
export const providerUpdateStaff = withFeedback(providerUpdateStaffAction, { en: 'Staff details saved.', ar: 'تم حفظ بيانات الموظف.', 'ar-eg': 'تم حفظ بيانات الموظف.' });
export const removeStaffMember = withFeedback(removeStaffMemberAction, { en: 'Staff member removed.', ar: 'تم حذف الموظف.', 'ar-eg': 'تم حذف الموظف.' });
export const assignSupervisorToEvent = withFeedback(assignSupervisorToEventAction, { en: 'Supervisor assignment updated.', ar: 'تم تحديث تعيين المشرف.', 'ar-eg': 'تم تحديث تعيين المشرف.' });
export const requestEventAction = withFeedback(requestEventActionAction, { en: 'Request submitted for admin review.', ar: 'تم إرسال الطلب لمراجعة الإدارة.', 'ar-eg': 'تم إرسال الطلب لمراجعة الإدارة.' });
export const resolveEventActionRequest = withFeedback(resolveEventActionRequestAction, { en: 'Request resolved.', ar: 'تمت مراجعة الطلب.', 'ar-eg': 'تمت مراجعة الطلب.' });
export const adminBlockUser = withFeedback(adminBlockUserAction, { en: 'Account blocked.', ar: 'تم حظر الحساب.', 'ar-eg': 'تم حظر الحساب.' });
export const providerBlockStaff = withFeedback(providerBlockStaffAction, { en: 'Account blocked.', ar: 'تم حظر الحساب.', 'ar-eg': 'تم حظر الحساب.' });
export const adminUnblockUser = withFeedback(adminUnblockUserAction, { en: 'Account unblocked.', ar: 'تم إلغاء حظر الحساب.', 'ar-eg': 'تم إلغاء حظر الحساب.' });
export const providerUnblockStaff = withFeedback(providerUnblockStaffAction, { en: 'Account unblocked.', ar: 'تم إلغاء حظر الحساب.', 'ar-eg': 'تم إلغاء حظر الحساب.' });
export const adminDeleteUser = withFeedback(adminDeleteUserAction, { en: 'Account deleted.', ar: 'تم حذف الحساب.', 'ar-eg': 'تم حذف الحساب.' });
export const adminVerifyUser = withFeedback(adminVerifyUserAction, { en: 'Account verified.', ar: 'تم توثيق الحساب.', 'ar-eg': 'تم توثيق الحساب.' });
export const adminUnverifyUser = withFeedback(adminUnverifyUserAction, { en: 'Account verification removed.', ar: 'تم إلغاء توثيق الحساب.', 'ar-eg': 'تم إلغاء توثيق الحساب.' });
export const adminResetLateExcuses = withFeedback(adminResetLateExcusesAction, { en: 'Late excuse count reset.', ar: 'تمت إعادة تعيين عدد الاعتذارات المتأخرة.', 'ar-eg': 'تمت إعادة تعيين عدد الاعتذارات المتأخرة.' });
export const markAllNotificationsAsRead = withFeedback(markAllNotificationsAsReadAction, { en: 'Notifications marked as read.', ar: 'تم تحديد التنبيهات كمقروءة.', 'ar-eg': 'تم تحديد التنبيهات كمقروءة.' });
export const clearAllNotifications = withFeedback(clearAllNotificationsAction, { en: 'Notifications cleared.', ar: 'تم مسح التنبيهات.', 'ar-eg': 'تم مسح التنبيهات.' });
export const markCashSettlementLinePaid = withFeedback(markCashSettlementLinePaidAction, { en: 'Cash payment recorded.', ar: 'تم تسجيل الدفع النقدي.', 'ar-eg': 'تم تسجيل الدفع النقدي.' });
export const removeOrganizerCard = withFeedback(removeOrganizerCardAction, { en: 'Saved card removed.', ar: 'تم حذف البطاقة المحفوظة.', 'ar-eg': 'تم حذف البطاقة المحفوظة.' });
export const forgotPassword = withFeedback(forgotPasswordAction, { en: 'Recovery code sent. Check your email.', ar: 'تم إرسال رمز الاستعادة. تحقق من بريدك الإلكتروني.', 'ar-eg': 'تم إرسال رمز الاستعادة. تحقق من بريدك الإلكتروني.' });
export const verifyResetOtp = withFeedback(verifyResetOtpAction, { en: 'Code verified.', ar: 'تم التحقق من الرمز.', 'ar-eg': 'تم التحقق من الرمز.' });
export const resetPassword = withFeedback(resetPasswordAction, { en: 'Password updated. You can now sign in.', ar: 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.', 'ar-eg': 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.' });
export const register = withFeedback(registerAction, { en: 'Account created. Check your verification email.', ar: 'تم إنشاء الحساب. تحقق من رسالة تفعيل البريد الإلكتروني.', 'ar-eg': 'تم إنشاء الحساب. تحقق من رسالة تفعيل البريد الإلكتروني.' });
export const login = withFeedback(loginAction, { en: 'Signed in successfully.', ar: 'تم تسجيل الدخول بنجاح.', 'ar-eg': 'تم تسجيل الدخول بنجاح.' });
export const generateEventAttendanceQr = withFeedback(generateEventAttendanceQrAction, { en: 'Attendance QR created.', ar: 'تم إنشاء رمز الحضور.', 'ar-eg': 'تم إنشاء رمز الحضور.' });
export const createEventSettlement = withFeedback(createEventSettlementAction, { en: 'Settlement prepared.', ar: 'تم تجهيز التسوية.', 'ar-eg': 'تم تجهيز التسوية.' });
export const startOrganizerCardEnrollment = withFeedback(startOrganizerCardEnrollmentAction, { en: 'Card setup started.', ar: 'بدأ إعداد البطاقة.', 'ar-eg': 'بدأ إعداد البطاقة.' });

export const createEventWhatsAppGroup = withFeedback(createEventWhatsAppGroupAction, { en: 'WhatsApp sharing link prepared.', ar: 'تم تجهيز رابط المشاركة عبر واتساب.' });
