/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AppNotification, Application, ApplicationStatus, Attendance, AttendanceCheckInResult, AttendanceQr, AttendanceStatus,
    AuthResponse, Event, EventActionRequest, EventActionRequestType, EventFilters,
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
export async function adminBlockUser(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}/block`, { method: 'PATCH' }); }
export async function adminUnblockUser(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}/unblock`, { method: 'PATCH' }); }
export async function adminDeleteUser(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }); }
export async function adminUpdateEventStatus(eventId: string, status: EventStatus): Promise<Event> {
    const payload = await apiRequest(`/admin/events/${eventId}/status`, { method: 'PATCH', body: { status } }); return normalizeEvent(payload.data);
}
export async function adminResetLateExcuses(talentId: string): Promise<void> { await apiRequest(`/admin/ushers/${talentId}/reset-excuses`, { method: 'POST' }); }
export async function adminDeleteEvent(eventId: string): Promise<void> { await apiRequest(`/admin/events/${eventId}`, { method: 'DELETE' }); }
export async function adminVerifyUser(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}/verify`, { method: 'PATCH' }); }
export async function adminUnverifyUser(userId: string): Promise<void> { await apiRequest(`/admin/users/${userId}/unverify`, { method: 'PATCH' }); }
export async function adminInviteUser(data: {
    email: string; password?: string; role: UserRole; fullName?: string; city?: string; companyName?: string; providerProfileId?: string;
}): Promise<User> {
    const payload = await apiRequest('/admin/users', { method: 'POST', body: data }); return normalizeUser(payload.data) as User;
}

// Auth
export async function login(email: string, password: string): Promise<AuthResponse> {
    const payload = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    const response = payload.data || payload;
    return { token: '', user: normalizeUser(response.user || payload.user) };
}
export async function register(email: string, password: string, role: 'talent' | 'provider'): Promise<RegistrationResponse> {
    const payload = await apiRequest('/auth/signup', { method: 'POST', body: { email, password, role: role === 'talent' ? 'usher' : 'organizer' } });
    return { user: normalizeUser(payload.data), message: payload.message || 'Account created', verificationRequired: true };
}
export async function getCurrentUser(): Promise<Omit<User, 'password'>> {
    const payload = await apiRequest('/auth/me'); return normalizeUser(payload.data);
}
export async function logoutSession(): Promise<void> {
    await apiRequest('/auth/logout', { method: 'POST' }, false);
}
export async function forgotPassword(email: string): Promise<string> {
    const payload = await apiRequest('/auth/forget-password', { method: 'POST', body: { email } }, false);
    return payload.message;
}
export async function verifyResetOtp(email: string, otp: string): Promise<string> {
    const payload = await apiRequest('/auth/verify-otp', { method: 'POST', body: { email, otp } }, false);
    return payload.data?.resetToken || payload.resetToken;
}
export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
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
export async function updateTalentProfile(userId: string, data: Partial<TalentProfile>): Promise<TalentProfile> {
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
export async function uploadTalentPortfolioImage(file: File): Promise<string[]> {
    const form = new FormData(); form.append('image', file);
    const payload = await apiRequest('/talent/profile/portfolio', { method: 'POST', body: form });
    return (payload.data || []).map((image: any) => image?.secure_url || image?.url || image);
}
export async function deleteTalentPortfolioImage(index: number): Promise<string[]> {
    const payload = await apiRequest(`/talent/profile/portfolio/${index}`, { method: 'DELETE' });
    return (payload.data || []).map((image: any) => image?.secure_url || image?.url || image);
}
export async function addPaymentMethod(
    _userId: string, providerOrMethod: string | Omit<PaymentMethod, '_id' | 'isDefault'>, numberOrDetail?: string,
): Promise<PaymentMethod[]> {
    const body = typeof providerOrMethod === 'string' ? { provider: providerOrMethod, numberOrDetail } : providerOrMethod;
    const payload = await apiRequest('/talent/profile/payment-methods', { method: 'POST', body });
    return (payload.data || []).map(normalizePaymentMethod);
}
export async function deletePaymentMethod(_userId: string, methodId: string): Promise<PaymentMethod[]> {
    const payload = await apiRequest(`/talent/profile/payment-methods/${methodId}`, { method: 'DELETE' }); return (payload.data || []).map(normalizePaymentMethod);
}
export async function setDefaultPaymentMethod(_userId: string, methodId: string): Promise<PaymentMethod[]> {
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
export async function updateProviderProfile(userId: string, data: Partial<ProviderProfile>): Promise<ProviderProfile> {
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
export async function createEvent(data: Omit<Event, '_id' | 'createdAt' | 'hiredTalents' | 'status'>): Promise<Event> {
    const { providerId: _providerId, photo, ...body } = data;
    const payload = await apiRequest('/provider/events', { method: 'POST', body });
    let event = normalizeEvent(payload.data);
    if (photo?.startsWith('data:')) event = await uploadEventPhoto(event._id, await dataUrlToFile(photo, 'event-photo.jpg'));
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
export async function getProviderEvents(_providerId: string, filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    const payload = await apiRequest(`/provider/events${queryString({ ...filters, limit: filters?.limit || 100 })}`); return listResponse(payload, normalizeEvent);
}
export async function getOpenEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    const payload = await apiRequest(`/talent/events/browse${queryString({ ...filters, limit: filters?.limit || 100 })}`); return listResponse(payload, normalizeEvent);
}
export async function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const { photo, ...body } = data;
    const payload = await apiRequest(`/provider/events/${id}`, { method: 'PUT', body });
    let event = normalizeEvent(payload.data);
    if (photo?.startsWith('data:')) event = await uploadEventPhoto(id, await dataUrlToFile(photo, 'event-photo.jpg'));
    return event;
}
export async function uploadEventPhoto(eventId: string, file: File): Promise<Event> {
    const form = new FormData(); form.append('photo', file);
    const payload = await apiRequest(`/provider/events/${eventId}/photo`, { method: 'PATCH', body: form });
    return normalizeEvent(payload.data);
}
export async function deleteEvent(id: string): Promise<void> { await apiRequest(`/provider/events/${id}`, { method: 'DELETE' }); }
export async function generateEventAttendanceQr(eventId: string): Promise<AttendanceQr> {
    const payload = await apiRequest(`/provider/events/${eventId}/attendance-qr`, { method: 'POST' });
    return payload.data;
}
export async function getEventAttendanceQr(eventId: string): Promise<AttendanceQr> {
    const payload = await apiRequest(`/provider/events/${eventId}/attendance-qr`);
    return payload.data;
}

// Applications
export async function applyToEvent(eventId: string, _talentId: string): Promise<Application> {
    const payload = await apiRequest('/talent/events/apply', { method: 'POST', body: { eventId } }); return normalizeApplication(payload.data);
}
export async function directBookTalent(eventId: string, talentId: string): Promise<Application> {
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
export async function updateApplicationStatus(appId: string, status: ApplicationStatus): Promise<Application> {
    const payload = await apiRequest(`/provider/applications/${appId}/status`, { method: 'PATCH', body: { status } }); return normalizeApplication(payload.data);
}

// Attendance and reviews
export async function getEventAttendance(eventId: string): Promise<(Attendance & { talent: TalentProfile })[]> {
    const payload = await apiRequest(`/provider/events/${eventId}/attendance`);
    return (payload.data || []).map((value: any) => ({ ...normalizeAttendance(value), talent: normalizeTalent(value.talent) }));
}
export async function markAttendance(eventId: string, talentId: string, status: AttendanceStatus): Promise<Attendance> {
    const payload = await apiRequest(`/provider/events/${eventId}/attendance`, { method: 'POST', body: { talentId, status } }); return normalizeAttendance(payload.data);
}
export async function checkInWithAttendanceQr(token: string): Promise<AttendanceCheckInResult> {
    const payload = await apiRequest('/talent/attendance/check-in', { method: 'POST', body: { token } });
    return {
        attendance: normalizeAttendance(payload.data.attendance),
        event: normalizeEvent(payload.data.event),
        alreadyCheckedIn: Boolean(payload.data.alreadyCheckedIn),
    };
}
export async function excuseFromEvent(talentId: string, eventId: string): Promise<{ isLate: boolean; lateExcuseCount: number }> {
    const applications = await getTalentApplications(talentId);
    const application = applications.find((item) => item.eventId === eventId && item.status === ApplicationStatus.ACCEPTED);
    if (!application) throw new Error('No accepted application found for this event');
    const payload = await apiRequest(`/talent/applications/${application._id}/excuse`, { method: 'PATCH' });
    return { isLate: Boolean(payload.data?.isLateExcuse), lateExcuseCount: Number(payload.data?.lateExcuseCount || 0) };
}
export async function submitReview(data: {
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
export async function referTalentToEvent(eventId: string, _referrerTalentId: string, referredTalentId: string): Promise<Referral> {
    const payload = await apiRequest('/talent/refer', { method: 'POST', body: { eventId, referredTalentId } }); return normalizeReferral(payload.data);
}
export async function createReferralInvite(eventId: string): Promise<string> {
    const payload = await apiRequest('/talent/referral-invites', { method: 'POST', body: { eventId } });
    return payload.data.token;
}
export async function getReferralInvite(token: string): Promise<{ event: Event; referrer: TalentProfile }> {
    const payload = await apiRequest(`/auth/referral-invites/${encodeURIComponent(token)}`, {}, false);
    return { event: normalizeEvent(payload.data.event), referrer: normalizeTalent(payload.data.referrer) };
}
export async function redeemReferralInvite(token: string): Promise<Referral> {
    const payload = await apiRequest(`/talent/referral-invites/${encodeURIComponent(token)}/redeem`, { method: 'POST' });
    return normalizeReferral(payload.data);
}
export async function getTalentPendingReferrals(_talentId: string): Promise<(Referral & { event: Event; referrer: TalentProfile })[]> {
    const payload = await apiRequest('/talent/referrals/pending');
    return (payload.data || []).map((value: any) => ({ ...normalizeReferral(value), event: normalizeEvent(value.event), referrer: normalizeTalent(value.referrer) }));
}
export async function acceptReferral(referralId: string): Promise<Application> {
    const payload = await apiRequest(`/talent/referrals/${referralId}/accept`, { method: 'PATCH' }); return normalizeApplication(payload.data);
}
export async function declineReferral(referralId: string): Promise<void> { await apiRequest(`/talent/referrals/${referralId}/decline`, { method: 'PATCH' }); }
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
export async function inviteStaffMember(
    fullName: string, email: string, password = 'member123', role: UserRole = UserRole.PROVIDER_MEMBER,
): Promise<User> {
    const payload = await apiRequest('/provider/staff', { method: 'POST', body: { fullName, email, password, role } }); return normalizeUser(payload.data) as User;
}
export async function providerBlockStaff(memberUserId: string): Promise<void> { await apiRequest(`/provider/staff/${memberUserId}/block`, { method: 'PATCH' }); }
export async function providerUnblockStaff(memberUserId: string): Promise<void> { await apiRequest(`/provider/staff/${memberUserId}/unblock`, { method: 'PATCH' }); }
export async function providerUpdateStaff(
    memberUserId: string, data: { fullName?: string; email?: string; password?: string; role?: UserRole },
): Promise<User> {
    const payload = await apiRequest(`/provider/staff/${memberUserId}`, { method: 'PUT', body: data }); return normalizeUser(payload.data) as User;
}
export async function getStaffMembers(): Promise<Omit<User, 'password'>[]> {
    const payload = await apiRequest('/provider/staff'); return (payload.data || []).map(normalizeUser);
}
export async function removeStaffMember(memberUserId: string): Promise<void> { await apiRequest(`/provider/staff/${memberUserId}`, { method: 'DELETE' }); }
export async function assignSupervisorToEvent(eventId: string, supervisorUserId: string, add: boolean): Promise<Event> {
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
export async function requestEventAction(eventId: string, requestType: EventActionRequestType, reason?: string): Promise<EventActionRequest> {
    const payload = await apiRequest(`/provider/events/${eventId}/action-requests`, { method: 'POST', body: { requestType, reason } }); return normalizeEventActionRequest(payload.data);
}
export async function getPendingEventActionRequests(): Promise<(EventActionRequest & { event: Event; provider: ProviderProfile })[]> {
    const payload = await apiRequest('/admin/event-action-requests');
    return (payload.data || []).map((value: any) => ({
        ...normalizeEventActionRequest(value), event: normalizeEvent(value.event), provider: normalizeProvider(value.provider || value.organizer),
    }));
}
export async function resolveEventActionRequest(requestId: string, decision: 'approved' | 'rejected'): Promise<EventActionRequest> {
    const payload = await apiRequest(`/admin/event-action-requests/${requestId}`, { method: 'PATCH', body: { decision, status: decision } });
    return normalizeEventActionRequest(payload.data);
}
export interface CreateGroupResult {
    groupLink: string; groupId: string; includedTalents: TalentProfile[]; excludedNoPhone: TalentProfile[];
}
export async function createEventWhatsAppGroup(eventId: string): Promise<CreateGroupResult> {
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
export async function markAllNotificationsAsRead(_userId: string): Promise<void> { await apiRequest('/notifications/read-all', { method: 'PATCH' }); }
export async function clearAllNotifications(_userId: string): Promise<void> { await apiRequest('/notifications', { method: 'DELETE' }); }

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
export async function createEventSettlement(eventId: string, cardId?: string): Promise<EventSettlement> {
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
export async function markCashSettlementLinePaid(settlementId: string, lineId: string): Promise<EventSettlement> {
    const payload = await apiRequest(`/provider/settlements/${settlementId}/lines/${lineId}/cash-paid`, { method: 'PATCH' }); return normalizeSettlement(payload.data);
}
export async function getOrganizerCards(): Promise<OrganizerCard[]> {
    const payload = await apiRequest('/provider/payment-cards'); return payload.data || [];
}
export async function startOrganizerCardEnrollment(): Promise<{ id: string; checkoutUrl: string }> {
    const payload = await apiRequest('/provider/payment-cards/enrollments', { method: 'POST' }); return payload.data;
}
export async function getOrganizerCardEnrollment(enrollmentId: string): Promise<'pending' | 'completed' | 'failed'> {
    const payload = await apiRequest(`/provider/payment-cards/enrollments/${enrollmentId}`); return payload.data.status;
}
export async function setDefaultOrganizerCard(cardId: string): Promise<void> {
    await apiRequest(`/provider/payment-cards/${cardId}/default`, { method: 'PATCH' });
}
export async function removeOrganizerCard(cardId: string): Promise<void> { await apiRequest(`/provider/payment-cards/${cardId}`, { method: 'DELETE' }); }

export { API_URL };
export function canCreateOrBook(profile: ProviderProfile | null): boolean { return isProviderProfileComplete(profile); }
export function canApply(profile: TalentProfile | null): boolean { return isTalentProfileComplete(profile); }
