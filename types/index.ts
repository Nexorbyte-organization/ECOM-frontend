// ─── Enums ────────────────────────────────────────────

export enum UserRole {
    ADMIN = 'admin',
    TALENT = 'talent',
    PROVIDER = 'provider',
    PROVIDER_MEMBER = 'provider_member',
    PROVIDER_SUPERVISOR = 'provider_supervisor',
}

export enum EventStatus {
    OPEN = 'open',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum ApplicationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    EXCUSED = 'excused',
    /** On call and unpaid; moved into the team automatically if a spot opens before the start. */
    STANDBY = 'standby',
    /** The usher left standby, or took another booking that day. */
    WITHDRAWN = 'withdrawn',
}

export enum AttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late',
}

export enum GenderPreference {
    MALE = 'male',
    FEMALE = 'female',
    ANY = 'any',
}

export enum ReferralStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
}

export enum EventActionRequestType {
    CANCEL = 'cancel',
    DELETE = 'delete',
}

// ─── Models ───────────────────────────────────────────

export interface User {
    _id: string;
    email: string;
    password: string;
    role: UserRole;
    isVerified: boolean;
    isBlocked: boolean;
    createdAt: string;
    providerProfileId?: string;
    fullName?: string;
    actingAs?: {
        adminId: string;
        organizationId: string;
        organizationName: string;
    };
}

export interface PaymentMethod {
    _id: string;
    provider: string; // 'Vodafone Cash' | 'InstaPay' | 'Bank Account' etc.
    numberOrDetail?: string;
    isDefault: boolean;
    type?: 'wallet' | 'bank' | 'cash';
    issuer?: string;
    accountHolderName?: string;
    bankCode?: string;
    mobileNumber?: string;
    iban?: string;
    accountNumber?: string;
}

export interface TalentProfile {
    _id: string;
    userId: string;
    fullName: string;
    photo: string;
    city: string;
    workCities?: string[];
    languages: string[];
    experienceYears: number;
    education: string;
    categories: string[];
    refusedCategories: string[];
    portfolioImages: string[];
    availabilityDates: string[];
    reliabilityScore: number;
    ratingAverage: number;
    totalRatings: number;
    completedEventsCount: number;
    lateExcuseCount: number;
    consecutiveGoodEvents: number;
    /** Set automatically after repeated no-shows; no new bookings until then. */
    suspendedUntil?: string | null;
    paymentMethods?: PaymentMethod[];
    phoneNumber?: string;
    whatsappNumber?: string;
}

export interface ProviderProfile {
    _id: string;
    userId: string;
    companyName: string;
    logo: string;
    description: string;
    location: string;
    phone: string;
    website: string;
    autoAcceptHighRatedTalents: boolean;
}

export interface Event {
    _id: string;
    providerId: string;
    title: string;
    category: string;
    eventDate: string;
    applicationDeadline: string;
    startTime: string;
    endTime: string;
    location: string;
    gatheringLocation?: string;
    photo?: string;
    requiredCount: number;
    /** Unpaid on-call ushers kept in reserve; at most half the staff count, rounded up. */
    standbyCount?: number;
    /** Usher view only: 1-based place in this event's standby queue. */
    standbyPosition?: number | null;
    specifyGenders?: boolean;
    malesCount?: number;
    femalesCount?: number;
    genderPreference: GenderPreference;
    budget: number;
    dressCode: string;
    notes: string;
    status: EventStatus;
    hiredTalents: string[];
    createdAt: string;
    supervisorIds?: string[];
    whatsappGroupId?: string;
    whatsappGroupLink?: string;
    hasMapAssignment?: boolean;
    /** Optional venue pin; ushers near it can check in with "I'm here". */
    venueLatitude?: number | null;
    venueLongitude?: number | null;
    /** Platform fee kept for booked ushers who did not check in (organization view). */
    noShowFeeCents?: number;
    fundingMode?: FundingMode;
    fundsReleasedAt?: string | null;
    /** Usher view only: whether the organization already funded the pay for this event. */
    paymentProtection?: PaymentProtection;
}

export type FundingMode = 'prefund' | 'pay_after';
export type PaymentProtection = 'secured' | 'awaiting_funding' | 'released' | 'pay_after';

export interface LastTeam {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    talents: TalentProfile[];
    unavailableCount: number;
}

export interface RebookLastTeamResult {
    sourceEventId: string;
    invited: string[];
    skipped: { talentId: string; reason: string }[];
}

export interface EventMapPin {
    id: string;
    name: string;
    x: number;
    y: number;
    usherIds?: string[];
}

export interface EventMap {
    imageUrl: string | null;
    pins: EventMapPin[];
    ushers?: { id: string; name: string }[];
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
}

/** A staff phone showing the live check-in code for an event. */
export interface CheckInPoint {
    _id: string;
    eventId: string;
    staffUserId: string;
    staffName?: string | null;
    label?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    accuracyMeters?: number | null;
    locationUpdatedAt?: string | null;
    active: boolean;
    live?: boolean;
}

export interface CheckInPointView {
    point: CheckInPoint;
    open: boolean;
    opensAt: string;
    closesAt: string;
    checkInUrl?: string;
    code?: string;
    expiresAt?: string;
}

export type CheckInMethod = 'qr' | 'code' | 'location';

export interface AttendanceCheckInResult {
    attendance: Attendance;
    event: Pick<Event, '_id' | 'title' | 'eventDate'>;
    alreadyCheckedIn: boolean;
}

export interface EventActionRequest {
    _id: string;
    eventId: string;
    providerId: string; // ProviderProfile _id
    requestType: EventActionRequestType;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export interface Application {
    _id: string;
    eventId: string;
    talentId: string;
    status: ApplicationStatus;
    isDirect: boolean;
    /** The usher agreed to be on standby if the event is full. */
    standbyOk?: boolean;
    /** A direct invitation to the standby list. */
    standbyInvite?: boolean;
    /** Place in the standby queue; earliest is moved in first. */
    standbySince?: string | null;
    referredBy?: string; // talent ID of the referrer
    appliedAt: string;
}

export interface Referral {
    _id: string;
    eventId: string;
    referrerTalentId: string;
    referredTalentId: string;
    status: ReferralStatus;
    createdAt: string;
}

export interface Attendance {
    _id: string;
    eventId: string;
    talentId: string;
    status: AttendanceStatus;
    checkInTime: string | null;
    checkOutTime: string | null;
    /** qr/code/location: the usher proved it with their phone. staff: checked in by staff.
     *  auto: missed check-in, recorded as absent when check-in closed. */
    checkInMethod?: 'qr' | 'code' | 'location' | 'staff' | 'auto' | 'manual' | 'admin';
}

export interface Review {
    _id: string;
    eventId: string;
    reviewerId: string;
    reviewedUserId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

// ─── API Response Types ───────────────────────────────

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AuthResponse {
    token: string;
    user: Omit<User, 'password'>;
}

export interface RegistrationResponse {
    user: Omit<User, 'password'>;
    message: string;
    verificationRequired: true;
}

export type SettlementCollectionStatus = 'not_started' | 'pending' | 'paid' | 'failed' | 'refunded';
export type SettlementPayoutStatus = 'not_started' | 'queued' | 'processing' | 'partially_paid' | 'paid' | 'failed';
export type SettlementLinePayoutStatus = 'cash_due' | 'queued' | 'processing' | 'paid' | 'failed' | 'awaiting_method';

export interface OrganizerCard {
    _id: string;
    maskedPan: string;
    cardSubtype?: string;
    cardholderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    isDefault: boolean;
    testMode: boolean;
}

export interface SettlementLine {
    _id: string;
    talentId: string;
    attendanceStatus: 'present' | 'late' | null;
    lineType?: 'attendance' | 'cancellation_compensation';
    grossAmount: number;
    collectionAmount: number;
    platformFee: number;
    usherAmount: number;
    payoutMethodType: 'wallet' | 'bank' | 'cash';
    payoutProvider?: string;
    payoutDestinationMasked?: string;
    payoutStatus: SettlementLinePayoutStatus;
    failureReason?: string;
    payoutRetrySafe?: boolean;
    paidAt?: string;
    talent: Pick<TalentProfile, '_id' | 'userId' | 'fullName' | 'photo'>;
}

export interface SettlementPreviewLine extends Omit<SettlementLine, '_id' | 'talent'> {
    talentName: string;
    talentPhoto?: string;
}

export interface EventSettlement {
    _id: string;
    eventId: string;
    targetTalentId?: string | null;
    organizerId: string;
    grossAmount: number;
    collectionAmount: number;
    platformFee: number;
    usherAmount: number;
    cashDueAmount: number;
    currency: 'EGP';
    collectionStatus: SettlementCollectionStatus;
    payoutStatus: SettlementPayoutStatus;
    checkoutUrl?: string;
    expiresAt?: string | null;
    selectedCardId?: string | null;
    collectionFailureReason?: string;
    collectedAt?: string;
    paymentMethod?: string;
    payoutSandboxConfigured: boolean;
    testMode: true;
    fundingSource?: 'checkout' | 'prefund';
    lines: SettlementLine[];
}

export type PaymentTier = 'standard' | 'trusted';
export type TierReason = 'not_enough_paid_events' | 'overdue_payment' | 'negative_credit_balance';

export interface PaymentTierStatus {
    tier: PaymentTier;
    automaticTier: PaymentTier;
    override: PaymentTier | null;
    reasons: TierReason[];
    paidEventsCount: number;
    requiredPaidEvents: number;
    overdueEventsCount: number;
    overdueEvents: { _id: string; title: string }[];
}

export interface EventFundingCheckout {
    _id: string;
    eventId: string;
    source: 'paymob' | 'credit';
    amount: number;
    collectionStatus: SettlementCollectionStatus;
    checkoutUrl?: string | null;
    expiresAt?: string | null;
    selectedCardId?: string | null;
    collectionFailureReason?: string | null;
    paymentMethod?: string | null;
    collectedAt?: string | null;
    createdAt: string;
    active?: boolean;
}

export interface FundingRefund {
    _id: string;
    eventId: string;
    eventTitle?: string | null;
    amount: number;
    reason: 'no_show' | 'surplus' | 'cancellation';
    status: 'pending' | 'processing' | 'succeeded' | 'failed';
    failureReason?: string | null;
    processedAt?: string | null;
    createdAt: string;
}

export interface ReleaseUsher {
    talentId: string;
    fullName: string;
    photo: string;
    hasPayoutAccount: boolean;
    attendanceStatus?: 'present' | 'late';
    usherAmount?: number;
    platformFee?: number;
    grossAmount?: number;
    /** Not checked in: null until check-in closes, then absent. */
    status?: 'absent' | null;
    returnedWage?: number;
    keptFee?: number;
}

export interface ReleasePreview {
    attendanceFinal: boolean;
    checkInClosesAt: string;
    releaseDueAt: string | null;
    releaseAfterEndHours: number;
    canRelease: boolean;
    eventCompleted: boolean;
    blockers: { code: 'underfunded'; shortfall?: number }[];
    payable: ReleaseUsher[];
    notCheckedIn: ReleaseUsher[];
    noShowFee: number;
    returnAmount: number;
    surplus: number;
}

export interface EventFundingSummary {
    eventId: string;
    fundingMode: FundingMode;
    eventStatus: EventStatus;
    tier: PaymentTierStatus;
    hiredCount: number;
    requiredCount: number;
    perUsherAmount: number;
    requiredAmount: number;
    fundedAmount: number;
    shortfallAmount: number;
    surplusAmount: number;
    fullyFunded: boolean;
    deadline: string | null;
    deadlineHours: number;
    overdue: boolean;
    released: boolean;
    fundsReleasedAt: string | null;
    releaseDueAt: string | null;
    noShowFee: number;
    protection: PaymentProtection;
    creditBalance: number;
    creditToApply: number;
    pendingCheckout: EventFundingCheckout | null;
    fundings: EventFundingCheckout[];
    cancellationPolicy: { tiers: { minHoursBeforeStart: number | null; refundPercent: number }[]; currentRefundPercent: number | null };
    releasePreview: ReleasePreview | null;
    settlements: EventSettlement[];
    refunds: FundingRefund[];
    payoutSandboxConfigured: boolean;
    savedCards?: OrganizerCard[];
}

export type CreditEntryType = 'event_surplus' | 'no_show_refund' | 'cancellation_refund' | 'late_funding_refund'
    | 'card_refund_failed' | 'funding_applied' | 'chargeback' | 'admin_adjustment';

export interface CreditEntry {
    _id: string;
    amount: number;
    type: CreditEntryType;
    eventId?: string | null;
    eventTitle?: string | null;
    note?: string | null;
    createdAt: string;
}

export interface OrganizerCreditOverview {
    balance: number;
    tier: PaymentTierStatus;
    entries: CreditEntry[];
    refunds: FundingRefund[];
    organization?: { _id: string; fullName: string };
}

export interface UnderfundedEvent {
    event: { _id: string; title: string; eventDate: string; status: EventStatus };
    organization: { _id: string; fullName: string };
    requiredAmount: number;
    fundedAmount: number;
    shortfallAmount: number;
    deadline: string | null;
    overdue: boolean;
}

export interface AdminPaymentsOverview {
    underfunded: UnderfundedEvent[];
    failedRefunds: FundingRefund[];
}

export interface EventSettlementPreview {
    testMode: true;
    eventId: string;
    feePercent: number;
    grossAmount: number;
    collectionAmount: number;
    platformFee: number;
    usherAmount: number;
    cashDueAmount: number;
    payoutSandboxConfigured: boolean;
    savedCards: OrganizerCard[];
    lines: SettlementPreviewLine[];
}

// ─── Filter Types ─────────────────────────────────────

export interface TalentSearchFilters {
    city?: string;
    category?: string;
    minExperience?: number;
    maxExperience?: number;
    availableDate?: string;
    page?: number;
    limit?: number;
}

export interface EventFilters {
    status?: EventStatus;
    category?: string;
    city?: string;
    page?: number;
    limit?: number;
}

// ─── Notification & Email Types ────────────────────────
export interface AppNotification {
    _id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    isRead: boolean;
    createdAt: string;
    link?: string;
}

export interface SimulatedEmail {
    _id: string;
    to: string;
    toName: string;
    subject: string;
    body: string;
    sentAt: string;
}
