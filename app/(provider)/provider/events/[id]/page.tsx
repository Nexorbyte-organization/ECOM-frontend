'use client';

import { toast } from '@/lib/toast';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getEvent, getEventApplicants, getEventAttendance, updateApplicationStatus,
    staffCheckIn, submitReview, isVerifiedTalent,
    getStaffMembers, assignSupervisorToEvent, getAllTalents,
    getProviderProfileByUserId, getProviderEvents, directBookTalent, getLastTeam, rebookLastTeam,
    updateEvent, completeEvent, getEventReviews,
    createEventSettlement, getEventSettlement, getEventSettlementPreview,
    createIndividualSettlement, getIndividualSettlements, retrySettlementLinePayout,
    getOrganizerCards,
    markCashSettlementLinePaid,
} from '@/lib/api';
import { tryGetCurrentLocation } from '@/lib/geolocation';
import { Event, Application, TalentProfile, Attendance, ApplicationStatus, AttendanceStatus, User, UserRole, EventStatus, EventSettlement, EventSettlementPreview, EventFundingSummary, LastTeam } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { formatDate, formatDayDate, formatEventDates, formatEventHours, getEventDays } from '@/lib/utils';
import {
    MapPin, Clock, Users, Shirt, FileText, ArrowLeft, Check, X,
    UserCheck, Star, CalendarX, Search, Plus, Minus, Send, Phone, MessageCircle, CreditCard,
    AlertTriangle, QrCode, LoaderCircle, Pencil, Hourglass,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import EditEventModal, { canEditEvent } from '@/components/events/EditEventModal';
import EventFundingCard from '@/components/events/EventFundingCard';
import EventHoldPayments from '@/components/events/EventHoldPayments';
import { EventScheduleList } from '@/components/events/EventDaysField';
import { lineStatus } from '@/components/payments/paymentLabels';

const hasActiveCheckout = (settlement: EventSettlement | null) => Boolean(
    settlement?.collectionStatus === 'pending'
    && settlement.checkoutUrl
    && settlement.expiresAt
    && Date.parse(settlement.expiresAt) > Date.now()
);

const isPayable = (record?: Attendance) => record?.status === AttendanceStatus.PRESENT || record?.status === AttendanceStatus.LATE;

// The event day to show first on the attendance tab: today, else the latest day that has started.
const defaultAttendanceDay = (event: Event) => {
    const today = new Date().toISOString().slice(0, 10);
    const days = getEventDays(event);
    const started = days.filter((day) => day.date <= today).length;
    return Math.max(0, started - 1);
};

const selfCheckIn = (record?: Attendance) => ['qr', 'code', 'location'].includes(record?.checkInMethod || '');
const checkInMethodLabel = (method?: Attendance['checkInMethod']) => ({
    qr: 'Scanned QR', code: 'Typed code', location: 'Checked in by location',
    staff: 'Checked in by staff', auto: 'Did not check in', manual: 'Marked by staff', admin: 'Set by admin',
} as Record<string, string>)[method || ''] || 'Recorded';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [applicants, setApplicants] = useState<(Application & { talent: TalentProfile })[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<(Attendance & { talent: TalentProfile })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'applicants' | 'attendance'>('details');
    const [reviewModal, setReviewModal] = useState<{ open: boolean; talentUserId: string; talentName: string }>({ open: false, talentUserId: '', talentName: '' });
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewedUserIds, setReviewedUserIds] = useState<string[]>([]);
    const [editOpen, setEditOpen] = useState(false);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [settlementPreview, setSettlementPreview] = useState<EventSettlementPreview | null>(null);
    const [settlement, setSettlement] = useState<EventSettlement | null>(null);
    const [individualSettlements, setIndividualSettlements] = useState<EventSettlement[]>([]);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [selectedCardId, setSelectedCardId] = useState('');
    const [cashTalentIds, setCashTalentIds] = useState<string[]>([]);
    const [fundingSummary, setFundingSummary] = useState<EventFundingSummary | null>(null);
    const [fundingRefreshKey, setFundingRefreshKey] = useState(0);

    const [supervisors, setSupervisors] = useState<Omit<User, 'password'>[]>([]);
    const [applicationBusy, setApplicationBusy] = useState<string | null>(null);
    const [attendanceBusy, setAttendanceBusy] = useState<string | null>(null);
    // Multi-day events: attendance is recorded per day.
    const [attendanceDay, setAttendanceDay] = useState<number | null>(null);
    const [reviewBusy, setReviewBusy] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const [bookModalOpen, setBookModalOpen] = useState(false);
    const [lastTeam, setLastTeam] = useState<LastTeam | null>(null);
    const [rebookingLastTeam, setRebookingLastTeam] = useState(false);
    const [providerEvents, setProviderEvents] = useState<Event[]>([]);
    const [selectedTargetEventId, setSelectedTargetEventId] = useState('');
    const [selectedTalents, setSelectedTalents] = useState<TalentProfile[]>([]);
    const [allTalents, setAllTalents] = useState<TalentProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSearchQuery, setSelectedSearchQuery] = useState('');
    const [bookOptionsLoading, setBookOptionsLoading] = useState(false);
    const [bookSubmitting, setBookSubmitting] = useState(false);

    // WhatsApp group link (manual)
    const [waLink, setWaLink] = useState('');
    const [waLinkSaving, setWaLinkSaving] = useState(false);

    const fetchData = async () => {
        if (!params.id) return;
        const id = params.id as string;
        const [e, apps, att, staff] = await Promise.all([
            getEvent(id),
            getEventApplicants(id),
            getEventAttendance(id),
            getStaffMembers().catch((err) => {
                setError(err instanceof Error ? err.message : 'Could not load staff.');
                return [];
            }),
        ]);
        setEvent(e);
        if (e?.status === EventStatus.OPEN) {
            getLastTeam(id).then(setLastTeam).catch(() => setLastTeam(null));
        } else {
            setLastTeam(null);
        }
        setApplicants(apps);
        setAttendanceRecords(att);
        setSupervisors(staff.filter((s) => s.role === UserRole.PROVIDER_SUPERVISOR));
        // Reviews only drive the filled star beside Rate, so a failed read leaves them empty.
        const reviews = await getEventReviews(id).catch(() => []);
        setReviewedUserIds(reviews.map((review) => review.reviewedUserId));
        // Sync WhatsApp link input with saved event value
        setWaLink(e?.whatsappGroupLink ?? '');
        // Prefunded events are paid from held funds, shown by the funding card instead.
        if (e?.status === EventStatus.COMPLETED && user?.role === UserRole.PROVIDER && e.fundingMode === 'pay_after') {
            const [bulkSettlement, individualPayments] = await Promise.all([
                getEventSettlement(id), getIndividualSettlements(id),
            ]);
            setSettlement(bulkSettlement);
            setIndividualSettlements(individualPayments);
        }
        setLoading(false);
    };

    const handleToggleSupervisor = async (supervisorUserId: string, add: boolean) => {
        if (!event) return;
        setAssigning(true);
        try {
            await assignSupervisorToEvent(event._id, supervisorUserId, add);
            await fetchData();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update supervisor assignment');
        } finally {
            setAssigning(false);
        }
    };

    const [completing, setCompleting] = useState(false);
    const handleCompleteEvent = async () => {
        if (!event) return;
        setCompleting(true);
        try {
            await completeEvent(event._id);
            await fetchData();
        } catch {
            // The toast already explains why the event cannot be completed yet.
        } finally {
            setCompleting(false);
        }
    };

    const handleSaveWhatsAppLink = async () => {
        if (!event) return;
        setWaLinkSaving(true);
        try {
            await updateEvent(event._id, { whatsappGroupLink: waLink.trim() || undefined });
            await fetchData();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to save WhatsApp group link');
        } finally {
            setWaLinkSaving(false);
        }
    };

    const handleOpenBookModal = async () => {
        if (!event || !user) return;
        setSearchQuery('');
        setSelectedSearchQuery('');
        setBookSubmitting(false);
        setBookOptionsLoading(true);
        setBookModalOpen(true);
        setAllTalents([]);
        setProviderEvents([]);
        setSelectedTalents([]);
        try {
            const [talentsList, profile] = await Promise.all([
                getAllTalents(),
                getProviderProfileByUserId(user._id),
            ]);
            setAllTalents(talentsList);
            
            // Hired talents in this completed event
            const initialHired = talentsList.filter((t) => event.hiredTalents.includes(t._id));
            setSelectedTalents(initialHired);

            if (profile) {
                const res = await getProviderEvents(profile._id, { limit: 100 });
                // Target events that are open/active and NOT this event
                const activeEvents = res.data.filter((e) => e._id !== event._id && e.status === 'open');
                setProviderEvents(activeEvents);
                if (activeEvents.length > 0) {
                    setSelectedTargetEventId(activeEvents[0]._id);
                } else {
                    setSelectedTargetEventId('');
                }
            }
            setBookModalOpen(true);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to initialize booking list');
        } finally {
            setBookOptionsLoading(false);
        }
    };

    const handleRebookLastTeam = async () => {
        if (!event) return;
        setRebookingLastTeam(true);
        try {
            const result = await rebookLastTeam(event._id);
            toast.success(result.invited.length
                ? 'Invitations sent to ' + result.invited.length + ' usher' + (result.invited.length === 1 ? '' : 's') + '.'
                : 'The previous team already has invitations or no slots are available.');
            await fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not rebook the previous team.');
        } finally {
            setRebookingLastTeam(false);
        }
    };

    const handleExcludeTalent = (talentId: string) => {
        setSelectedTalents((prev) => prev.filter((t) => t._id !== talentId));
    };

    const handleAddTalent = (talent: TalentProfile) => {
        setSelectedTalents((prev) => {
            if (prev.some((t) => t._id === talent._id)) return prev;
            return [...prev, talent];
        });
    };

    const handleBookSubmit = async () => {
        if (!selectedTargetEventId) {
            toast.error('Please select a target event to book talents to.');
            return;
        }
        if (selectedTalents.length === 0) {
            toast.error('Please select at least one talent to book.');
            return;
        }
        setBookSubmitting(true);
        try {
            // Bulk call directBookTalent
            await Promise.all(
                selectedTalents.map((t) => directBookTalent(selectedTargetEventId, t._id))
            );
            toast.success(`Booking requests sent for ${selectedTalents.length} talents.`);
            setBookModalOpen(false);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to send bookings.');
        } finally {
            setBookSubmitting(false);
        }
    };

    // fetchData intentionally reruns only when the selected event changes.
    useEffect(() => {
        void fetchData().catch((err) => {
            setError(err instanceof Error ? err.message : 'Could not load event.');
            setLoading(false);
        });
    }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApplicationAction = async (appId: string, status: ApplicationStatus) => {
        if (applicationBusy) return;
        setApplicationBusy(appId);
        setError('');
        try {
            await updateApplicationStatus(appId, status);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not update application.');
        } finally { setApplicationBusy(null); }
    };

    // Staff check an usher in when the usher's phone cannot; the staff phone's location is sent
    // when available. Nobody marks absent: a missed check-in becomes a no-show automatically.
    const handleStaffCheckIn = async (talentId: string, status: 'present' | 'late') => {
        if (!event || attendanceBusy) return;
        setAttendanceBusy(talentId);
        setError('');
        try {
            const multiDay = getEventDays(event).length > 1;
            const day = attendanceDay ?? defaultAttendanceDay(event);
            await staffCheckIn(event._id, talentId, status, await tryGetCurrentLocation(), multiDay ? day : undefined);
            await fetchData();
            setFundingRefreshKey((key) => key + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not check in this usher.');
        } finally { setAttendanceBusy(null); }
    };

    const handleOpenPayAll = async () => {
        if (!event) return;
        setPaymentLoading(true);
        setPaymentError('');
        setPayModalOpen(true);
        try {
            const preview = await getEventSettlementPreview(event._id);
            const [currentSettlement, individualPayments] = await Promise.all([
                getEventSettlement(event._id), getIndividualSettlements(event._id),
            ]);
            const savedCards = await getOrganizerCards().catch(() => preview.savedCards);
            setSettlementPreview({ ...preview, savedCards });
            setSettlement(currentSettlement);
            setIndividualSettlements(individualPayments);
            setCashTalentIds(hasActiveCheckout(currentSettlement)
                ? currentSettlement!.lines.filter((line) => line.payoutMethodType === 'cash').map((line) => line.talentId)
                : []);
            setSelectedCardId(hasActiveCheckout(currentSettlement)
                ? currentSettlement?.selectedCardId || ''
                : savedCards.find((card) => card.isDefault)?._id || '');
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Could not prepare the event payment.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleContinueToCheckout = async () => {
        if (!event) return;
        if (individualSettlements.length > 0) {
            setPaymentError('Individual payment has started. Pay the remaining ushers one by one to avoid charging anyone twice.');
            return;
        }
        setPaymentLoading(true);
        setPaymentError('');
        try {
            const cardId = hasActiveCheckout(settlement)
                ? settlement?.selectedCardId || undefined
                : selectedCardId || undefined;
            const nextSettlement = await createEventSettlement(event._id, cardId, cashTalentIds);
            setSettlement(nextSettlement);
            if (!nextSettlement.checkoutUrl) throw new Error('Paymob did not return a checkout link.');
            window.location.assign(nextSettlement.checkoutUrl);
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Could not start Paymob Test checkout.');
            setPaymentLoading(false);
        }
    };

    const handlePayIndividual = async (talentId: string) => {
        if (!event) return;
        const current = individualSettlements.find((item) => item.targetTalentId === talentId);
        if (hasActiveCheckout(current || null) && current?.checkoutUrl) {
            window.location.assign(current.checkoutUrl);
            return;
        }
        setPaymentLoading(true);
        setPaymentError('');
        try {
            const previewLine = settlementPreview?.lines.find((line) => line.talentId === talentId);
            const payInCash = cashTalentIds.includes(talentId) || previewLine?.payoutMethodType === 'cash'
                || current?.lines[0]?.payoutMethodType === 'cash';
            const next = await createIndividualSettlement(event._id, talentId, selectedCardId || undefined, payInCash);
            setIndividualSettlements((items) => [...items.filter((item) => item.targetTalentId !== talentId), next]);
            if (!next.checkoutUrl) throw new Error('Paymob did not return a checkout link.');
            window.location.assign(next.checkoutUrl);
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Could not prepare this usher payment.');
            setPaymentLoading(false);
        }
    };

    const handleRetryPayout = async (payment: EventSettlement, lineId: string) => {
        setPaymentLoading(true);
        setPaymentError('');
        try {
            const updated = await retrySettlementLinePayout(payment._id, lineId);
            if (updated.targetTalentId) {
                setIndividualSettlements((items) => items.map((item) => item._id === updated._id ? updated : item));
            } else {
                setSettlement(updated);
            }
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Could not retry this usher payout.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleMarkCashPaid = async (lineId: string, payment: EventSettlement) => {
        setPaymentLoading(true);
        setPaymentError('');
        try {
            const updated = await markCashSettlementLinePaid(payment._id, lineId);
            if (updated.targetTalentId) {
                setIndividualSettlements((items) => items.map((item) => item._id === updated._id ? updated : item));
            } else {
                setSettlement(updated);
            }
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Could not record the cash payment.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!user || !event || reviewBusy) return;
        setReviewBusy(true);
        setError('');
        try {
            await submitReview({
                eventId: event._id,
                reviewerId: user._id,
                reviewedUserId: reviewModal.talentUserId,
                rating: reviewRating,
                comment: reviewComment.trim(),
            });
            setReviewedUserIds((ids) => [...ids, reviewModal.talentUserId]);
            setReviewModal({ open: false, talentUserId: '', talentName: '' });
            setReviewRating(5);
            setReviewComment('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not submit review.');
        } finally { setReviewBusy(false); }
    };

    const statusVariant = (s: string) =>
        s === 'open' ? 'success' as const : s === 'confirmed' ? 'primary' as const : s === 'completed' ? 'default' as const : 'danger' as const;

    if (loading) return <ContentSkeleton variant="detail" className="mx-auto max-w-4xl" />;

    if (!event) return (
        <div className="text-center py-20">
            <p className="text-dark-400">{error || 'Event not found'}</p>
            <Link href="/provider/events" className="text-primary-400 text-sm mt-2 inline-block">← Back to events</Link>
        </div>
    );

    const lockedSettlement = settlement?.collectionStatus === 'paid' || hasActiveCheckout(settlement) ? settlement : null;
    const paymentLines = lockedSettlement?.lines || settlementPreview?.lines.map((line) => {
        const individualLine = individualSettlements.find((item) => item.targetTalentId === line.talentId)?.lines[0];
        if (individualLine) return individualLine;
        return cashTalentIds.includes(line.talentId) ? {
            ...line,
            payoutMethodType: 'cash' as const,
            payoutStatus: 'cash_due' as const,
            payoutProvider: undefined,
            payoutDestinationMasked: undefined,
            collectionAmount: line.platformFee,
        } : line;
    }) || [];
    const paymobCharge = lockedSettlement?.collectionAmount ?? Math.round(paymentLines.reduce((total, line) => total + line.collectionAmount * 100, 0)) / 100;
    const cashDue = lockedSettlement?.cashDueAmount ?? Math.round(paymentLines.reduce((total, line) => total + (line.payoutMethodType === 'cash' ? line.usherAmount * 100 : 0), 0)) / 100;
    // The backend moves standby ushers in earliest first.
    const eventDays = getEventDays(event);
    const selectedDay = attendanceDay ?? defaultAttendanceDay(event);
    const standbyQueue = applicants
        .filter((app) => app.status === 'standby')
        .sort((a, b) => Date.parse(a.standbySince || a.appliedAt) - Date.parse(b.standbySince || b.appliedAt));
    // Absent and unmarked ushers are never part of an event payment; on a multi-day event an usher
    // is paid for the days they checked in.
    const notPayable = applicants
        .filter((app) => app.status === ApplicationStatus.ACCEPTED)
        .map((app) => {
            const records = attendanceRecords.filter((record) => record.talentId === app.talentId);
            if (records.some(isPayable)) return { app, status: AttendanceStatus.PRESENT };
            return { app, status: records.some((record) => record.status === AttendanceStatus.ABSENT) ? AttendanceStatus.ABSENT : undefined };
        })
        .filter(({ status }) => status !== AttendanceStatus.PRESENT);
    const automaticPayoutsUnavailable = settlementPreview && !settlementPreview.payoutSandboxConfigured
        && paymentLines.some((line) => line.payoutMethodType !== 'cash');

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <Link href={`/provider/events/${event._id}/map`} className="inline-flex items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-500/10 px-4 py-3 text-sm font-semibold text-primary-400 hover:bg-primary-500/20 focus-visible:outline-2 focus-visible:outline-primary-400"><MapPin size={17} /> Open event map and locations</Link>
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors cursor-pointer">
                <ArrowLeft size={16} /> Back
            </button>

            {/* Header */}
            <Card className="overflow-hidden p-0">
                {event.photo && (
                    <div className="w-full h-48 sm:h-64 relative overflow-hidden">
                        <img 
                            src={event.photo} 
                            alt={event.title} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/70 to-transparent" />
                    </div>
                )}
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="primary">{event.category}</Badge>
                                <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                            </div>
                            <h1 className="text-xl font-bold text-dark-50">{event.title}</h1>
                            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-dark-400">
                                <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                                {event.gatheringLocation && (
                                    <span className="flex items-center gap-1" title="Gathering Location"><MapPin size={12} className="text-primary-400" /> Gathering: {event.gatheringLocation}</span>
                                )}
                                <span className="flex items-center gap-1"><Clock size={12} /> {formatEventDates(event)} · {formatEventHours(event)}</span>
                                <span className="flex items-center gap-1"><Users size={12} /> {event.hiredTalents.length}/{event.requiredCount}</span>
                                {Boolean(event.standbyCount) && (
                                    <span className="flex items-center gap-1" title="Unpaid on-call ushers who fill spots that open before the start">
                                        <Hourglass size={12} /> Standby {standbyQueue.length}/{event.standbyCount}
                                    </span>
                                )}
                                <span className={`flex items-center gap-1 ${new Date() > new Date(event.applicationDeadline) ? 'text-danger-400' : ''}`}>
                                    <CalendarX size={12} /> Deadline: {formatDate(event.applicationDeadline)} {new Date() > new Date(event.applicationDeadline) && '(Expired)'}
                                </span>
                            </div>
                        </div>
                        {event.status === EventStatus.OPEN && lastTeam && lastTeam.talents.length > 0 && (
                            <Button variant="primary" onClick={handleRebookLastTeam}
                                isLoading={rebookingLastTeam} icon={<Send size={15} />}
                                title={'Invite ushers from ' + lastTeam.eventTitle}>
                                Rebook last team ({lastTeam.talents.length})
                            </Button>
                        )}
                        {event.status === 'completed' && user?.role === UserRole.PROVIDER && (
                            <Button
                                variant="primary"
                                onClick={handleOpenBookModal}
                                icon={<Send size={15} />}
                                className="flex-shrink-0"
                            >
                                Re-book
                            </Button>
                        )}


                        {/* Completion unlocks usher payments; the backend checks that the event has ended. */}
                        {user?.role === UserRole.PROVIDER
                            && (event.status === EventStatus.OPEN || event.status === EventStatus.CONFIRMED)
                            && new Date(event.endDate || event.eventDate).toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10) && (
                            <Button variant="success" size="sm" icon={<Check size={15} />} isLoading={completing} onClick={handleCompleteEvent}>
                                Mark completed
                            </Button>
                        )}

                        {/* Organizations edit details by stage; cancelling or deleting is left to admins. */}
                        {user?.role === UserRole.PROVIDER && canEditEvent(event) && (
                            <Button variant="secondary" size="sm" icon={<Pencil size={15} />} onClick={() => setEditOpen(true)} className="flex-shrink-0">
                                Edit event
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {event.fundingMode === 'preauth' ? (
                <EventHoldPayments
                    event={event}
                    isOwner={user?.role === UserRole.PROVIDER}
                    refreshKey={fundingRefreshKey}
                    onEventChange={(updated) => setEvent((current) => current ? { ...current, ...updated } : updated)}
                />
            ) : (
                <EventFundingCard
                    event={event}
                    isOwner={user?.role === UserRole.PROVIDER}
                    refreshKey={fundingRefreshKey}
                    onEventChange={(updated) => setEvent((current) => current ? { ...current, ...updated } : updated)}
                    onSummary={setFundingSummary}
                />
            )}

            {/* Any organization staff member can open a check-in point on their phone. */}
            {event.status !== EventStatus.CANCELLED && !event.fundsReleasedAt && (
                <Card className="border-primary-500/25">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-500/10 text-primary-400">
                                <QrCode size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-dark-50">Check-in</h2>
                                <p className="mt-1 max-w-xl text-sm text-dark-400">
                                    Open the check-in screen on a supervisor’s phone where ushers meet: the gathering point, the bus, or the venue.
                                    Ushers scan its live QR or type its code, and must be near that phone. Anyone who does not check in counts as a no-show.
                                </p>
                            </div>
                        </div>
                        <Link href={`/provider/events/${event._id}/check-in`} className="shrink-0">
                            <Button icon={<QrCode size={16} />}>Open check-in screen</Button>
                        </Link>
                    </div>
                </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'details' as const, label: 'Details' },
                    { key: 'applicants' as const, label: `Applicants (${applicants.length})` },
                    { key: 'attendance' as const, label: 'Attendance' },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer ${activeTab === t.key
                            ? 'bg-primary-500/15 text-primary-300 border-primary-500/30'
                            : 'text-dark-400 border-dark-700 hover:border-dark-600'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
                <Card>
                    <div className="space-y-4">
                        {eventDays.length > 1 && (
                            <div>
                                <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-dark-400" /><p className="text-xs font-semibold text-dark-300 ">Schedule · {eventDays.length} days</p></div>
                                <EventScheduleList event={event} className="max-w-xl" />
                                <p className="mt-2 text-xs text-dark-400">Pay: {event.budget} EGP per usher per day ({event.budget * eventDays.length} EGP per usher for all days).</p>
                            </div>
                        )}
                        {event.dressCode && (
                            <div>
                                <div className="flex items-center gap-2 mb-1"><Shirt size={14} className="text-dark-400" /><p className="text-xs font-semibold text-dark-300 ">Dress Code</p></div>
                                <p className="text-sm text-dark-200">{event.dressCode}</p>
                            </div>
                        )}
                        {event.notes && (
                            <div>
                                <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-dark-400" /><p className="text-xs font-semibold text-dark-300 ">Notes</p></div>
                                <p className="text-sm text-dark-200">{event.notes}</p>
                            </div>
                        )}
                        {event.gatheringLocation && (
                            <div>
                                <p className="text-xs font-semibold text-dark-300 mb-1">Gathering Location</p>
                                <p className="text-sm text-dark-200">{event.gatheringLocation}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-semibold text-dark-300 mb-1">Gender Requirement</p>
                            {event.specifyGenders ? (
                                <p className="text-sm text-dark-200 font-medium">
                                    {event.malesCount} Male{event.malesCount !== 1 ? 's' : ''} · {event.femalesCount} Female{event.femalesCount !== 1 ? 's' : ''}
                                </p>
                            ) : (
                                <p className="text-sm text-dark-200 capitalize">{event.genderPreference}</p>
                            )}
                        </div>

                        {/* WhatsApp Group Link */}
                        {user?.role === UserRole.PROVIDER && (
                            <div className="border-t border-dark-700/50 pt-4 mt-2">
                                <label className="block text-xs font-semibold text-dark-300 mb-2 flex items-center gap-1.5">
                                    <MessageCircle size={14} className="text-success-500" />
                                    WhatsApp Group Link
                                </label>
                                <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                                    <Input
                                        placeholder="https://chat.whatsapp.com/..."
                                        value={waLink}
                                        onChange={(e) => setWaLink(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        isLoading={waLinkSaving}
                                        onClick={handleSaveWhatsAppLink}
                                        className="bg-success-500 hover:bg-success-600 border-success-600 text-white font-bold h-[38px] px-4 rounded-xl shrink-0"
                                    >
                                        Save Link
                                    </Button>
                                </div>
                                <p className="text-xs text-dark-500 mt-1.5">
                                    💡 This link will only be visible to ushers once their applications are accepted.
                                </p>
                            </div>
                        )}

                        {/* WhatsApp Group Link (View-only for supervisors/non-providers) */}
                        {user?.role !== UserRole.PROVIDER && event.whatsappGroupLink && (
                            <div className="border-t border-dark-700/50 pt-4 mt-2">
                                <p className="text-xs font-semibold text-dark-300 mb-1.5 flex items-center gap-1.5">
                                    <MessageCircle size={14} className="text-success-500" />
                                    WhatsApp Group Link
                                </p>
                                <a
                                    href={event.whatsappGroupLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary-500 hover:underline font-bold break-all flex items-center gap-1"
                                >
                                    {event.whatsappGroupLink}
                                </a>
                            </div>
                        )}

                        {/* Supervisor Assignment */}
                        {user?.role === UserRole.PROVIDER ? (
                            <div className="border-t border-dark-700/50 pt-4 mt-2">
                                <label className="block text-xs font-semibold text-dark-300 mb-2">Event Supervisors</label>
                                {supervisors.length === 0 ? (
                                    <p className="text-xs text-dark-500 italic">No supervisors in your team yet. Invite a supervisor from the Staff page.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {supervisors.map((s) => {
                                            const isAssigned = (event.supervisorIds ?? []).includes(s._id);
                                            return (
                                                <button
                                                    key={s._id}
                                                    aria-busy={assigning} disabled={assigning}
                                                    onClick={() => handleToggleSupervisor(s._id, !isAssigned)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                                                        isAssigned
                                                            ? 'bg-primary-500/15 border-primary-500/40 text-primary-400 hover:bg-danger-500/10 hover:border-danger-500/30 hover:text-danger-400'
                                                            : 'bg-dark-900/10 border-dark-700 text-dark-400 hover:border-primary-500/40 hover:text-primary-400 hover:bg-primary-500/10'
                                                    }`}
                                                    title={isAssigned ? `Remove ${s.fullName || s.email} from supervisors` : `Add ${s.fullName || s.email} as supervisor`}
                                                >
                                                    {assigning && <LoaderCircle aria-hidden="true" size={12} className="motion-safe:animate-spin" />}
                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAssigned ? 'bg-primary-400' : 'bg-dark-600'}`} />
                                                    {s.fullName || s.email.split('@')[0]}
                                                    {isAssigned && <span className="text-[10px] opacity-60 ml-0.5">✕</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {(event.supervisorIds ?? []).length > 0 && (
                                    <p className="text-xs text-dark-500 mt-2">{(event.supervisorIds ?? []).length} supervisor{(event.supervisorIds ?? []).length !== 1 ? 's' : ''} assigned · Click a chip to toggle</p>
                                )}
                            </div>
                        ) : (
                            (event.supervisorIds ?? []).length > 0 && (
                                <div className="border-t border-dark-700/50 pt-4 mt-2">
                                    <p className="text-xs font-semibold text-dark-300 mb-2">Assigned Supervisors</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(event.supervisorIds ?? []).map((sid) => {
                                            const s = supervisors.find(sv => sv._id === sid);
                                            return (
                                                <span key={sid} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 border border-primary-500/25 text-primary-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                                                    {s?.fullName || s?.email?.split('@')[0] || 'Supervisor'}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </Card>
            )}

            {activeTab === 'applicants' && (
                <div className="space-y-3">
                    {applicants.length === 0 ? (
                        <Card className="text-center py-8">
                            <Users size={32} className="mx-auto text-dark-600 mb-2" />
                            <p className="text-sm text-dark-500">No applicants yet</p>
                        </Card>
                    ) : (
                        applicants.map((app) => (
                            <Card key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar src={app.talent.photo} name={app.talent.fullName} size="lg" />
                                    <div>
                                        <Link href={`/provider/talent/${app.talent._id}`} className="text-sm font-semibold text-dark-100 hover:text-primary-500 transition-colors">{app.talent.fullName}</Link>
                                        <div className="flex items-center gap-3 text-xs text-dark-400 mt-0.5 flex-wrap">
                                            <span>{app.talent.city} · {app.talent.experienceYears}yr exp</span>
                                            {app.talent.phoneNumber && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={11} className="text-dark-500" />
                                                    <a href={`tel:${app.talent.phoneNumber}`} className="hover:text-primary-500 transition-colors font-medium">{app.talent.phoneNumber}</a>
                                                </span>
                                            )}
                                            {app.talent.whatsappNumber && (
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle size={11} className="text-success-500" />
                                                    <a href={`https://wa.me/${app.talent.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-success-600 text-success-500 font-semibold transition-colors">
                                                        WhatsApp
                                                    </a>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge variant="primary">{app.talent.reliabilityScore}% reliable</Badge>
                                            <Badge variant="warning">{app.talent.ratingAverage} ★</Badge>
                                            {isVerifiedTalent(app.talent) && <Badge variant="success">✅ Verified</Badge>}
                                            {app.isDirect && <Badge variant="info">{app.standbyInvite ? 'Standby invite' : 'Direct'}</Badge>}
                                            {app.status === 'pending' && !app.isDirect && app.standbyOk && <Badge variant="default">OK with standby</Badge>}
                                            {app.referredBy && (() => {
                                                const referrerName = applicants.find(a => a.talentId === app.referredBy)?.talent.fullName;
                                                return <Badge variant="info">👥 Referred{referrerName ? ` by ${referrerName}` : ''}</Badge>;
                                            })()}
                                            {app.talent.lateExcuseCount >= 5 && (
                                                <Badge variant="danger">⚠️ {app.talent.lateExcuseCount} Late Excuses</Badge>
                                            )}
                                            {app.talent.paymentMethods && app.talent.paymentMethods.find(m => m.isDefault) && (() => {
                                                const defPay = app.talent.paymentMethods.find(m => m.isDefault)!;
                                                return (
                                                    <Badge variant="default" className="border-dark-700 bg-dark-800 text-dark-300">
                                                        💳 {defPay.provider}{defPay.numberOrDetail ? `: ${defPay.numberOrDetail}` : ''}
                                                    </Badge>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {app.status === 'standby' ? (
                                        <>
                                            <Badge variant="info">Standby #{standbyQueue.findIndex((item) => item._id === app._id) + 1}</Badge>
                                            {event.hiredTalents.length < event.requiredCount && (
                                                <Button size="sm" variant="success" icon={<Check size={14} />} disabled={Boolean(applicationBusy)} isLoading={applicationBusy === app._id} onClick={() => handleApplicationAction(app._id, ApplicationStatus.ACCEPTED)}>
                                                    Move in
                                                </Button>
                                            )}
                                            <Button size="sm" variant="danger" icon={<X size={14} />} disabled={Boolean(applicationBusy)} isLoading={applicationBusy === app._id} onClick={() => handleApplicationAction(app._id, ApplicationStatus.REJECTED)}>
                                                Remove
                                            </Button>
                                        </>
                                    ) : app.status === 'pending' && app.isDirect ? (
                                        <>
                                            <Badge variant="warning">Awaiting usher</Badge>
                                            <Button size="sm" variant="danger" icon={<X size={14} />} disabled={Boolean(applicationBusy)} isLoading={applicationBusy === app._id} onClick={() => handleApplicationAction(app._id, ApplicationStatus.REJECTED)}>
                                                Withdraw
                                            </Button>
                                        </>
                                    ) : app.status === 'pending' ? (
                                        <>
                                            <Button size="sm" variant="success" icon={<Check size={14} />} disabled={Boolean(applicationBusy)} isLoading={applicationBusy === app._id} onClick={() => handleApplicationAction(app._id, ApplicationStatus.ACCEPTED)}>
                                                Accept
                                            </Button>
                                            {app.standbyOk && standbyQueue.length < (event.standbyCount || 0) && (
                                                <Button size="sm" variant="secondary" icon={<Hourglass size={14} />} disabled={Boolean(applicationBusy)} isLoading={applicationBusy === app._id} onClick={() => handleApplicationAction(app._id, ApplicationStatus.STANDBY)}>
                                                    Standby
                                                </Button>
                                            )}
                                            <Button size="sm" variant="danger" icon={<X size={14} />} disabled={Boolean(applicationBusy)} isLoading={applicationBusy === app._id} onClick={() => handleApplicationAction(app._id, ApplicationStatus.REJECTED)}>
                                                Reject
                                            </Button>
                                        </>
                                    ) : app.status === 'withdrawn' ? (
                                        <Badge variant="default">Left standby</Badge>
                                    ) : app.status === 'rejected' && app.standbySince ? (
                                        <Badge variant="default">Released from standby</Badge>
                                    ) : (
                                        <Badge variant={app.status === 'accepted' ? 'success' : 'danger'}>{app.status}</Badge>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="space-y-3">
                    {eventDays.length > 1 && (
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event day">
                            {eventDays.map((day, index) => {
                                const checkedIn = attendanceRecords.filter((record) => (record.dayIndex ?? 0) === index && isPayable(record)).length;
                                return (
                                    <button key={day.date} type="button" role="tab" aria-selected={selectedDay === index} onClick={() => setAttendanceDay(index)}
                                        className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${selectedDay === index ? 'border-primary-500 bg-primary-500/10 text-dark-50' : 'border-dark-700 text-dark-300 hover:border-dark-500'}`}>
                                        <span className="block font-semibold">Day {index + 1} · {formatDayDate(day.date)}</span>
                                        <span className="block text-dark-400">{day.startTime} – {day.endTime} · {checkedIn}/{event.hiredTalents.length} checked in</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {event.status === EventStatus.COMPLETED && user?.role === UserRole.PROVIDER && event.fundingMode === 'pay_after' && (
                        <Card className="border-primary-500/30">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={18} className="text-primary-500" />
                                        <h2 className="font-bold text-dark-50">Event payment</h2>
                                        <Badge variant="warning">TEST MODE</Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-dark-400">
                                        Pay every present or late usher together. Each usher receives 95%; 5% is deducted for transfer fees.
                                    </p>
                                    {settlement && (
                                        <p className="mt-2 text-xs font-semibold text-dark-300">
                                            Collection: <span className="capitalize text-primary-500">{settlement.collectionStatus}</span>
                                            {' · '}Payouts: <span className="capitalize text-primary-500">{settlement.payoutStatus.replace('_', ' ')}</span>
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="primary"
                                    icon={<CreditCard size={15} />}
                                    onClick={handleOpenPayAll}
                                    className="shrink-0"
                                >
                                    {settlement?.collectionStatus === 'paid' || individualSettlements.length > 0 ? 'View usher payments' : 'Pay all ushers'}
                                </Button>
                            </div>
                        </Card>
                    )}
                    {event.hiredTalents.length === 0 ? (
                        <Card className="text-center py-8">
                            <UserCheck size={32} className="mx-auto text-dark-600 mb-2" />
                            <p className="text-sm text-dark-500">No hired talent to track attendance for</p>
                        </Card>
                    ) : (
                        applicants.filter((a) => a.status === 'accepted').map((app) => {
                            const showPaymentStatus = event.status === EventStatus.COMPLETED && user?.role === UserRole.PROVIDER;
                            const talentRecords = attendanceRecords.filter((att) => att.talentId === app.talentId);
                            // The selected day's check-in (the only day on a one-day event).
                            const record = talentRecords.find((att) => (att.dayIndex ?? 0) === selectedDay);
                            const attendedDays = new Set(talentRecords.filter(isPayable).map((att) => att.dayIndex ?? 0)).size;
                            const attVariant = record?.status === 'present' ? 'success' as const : record?.status === 'late' ? 'warning' as const : record?.status === 'absent' ? 'danger' as const : 'default' as const;
                            const payment = individualSettlements.find((item) => item.targetTalentId === app.talentId) || settlement;
                            const paymentLine = payment?.lines.find((line) => line.talentId === app.talentId);
                            const attended = attendedDays > 0;
                            const dayAttended = isPayable(record);
                            // Only present/late ushers are paid (for the days they checked in); absent or unmarked ushers are left out.
                            const prefunded = event.fundingMode !== 'pay_after';
                            const prefundLine = fundingSummary?.settlements.flatMap((item) => item.lines).find((line) => line.talentId === app.talentId);
                            const releaseDue = fundingSummary?.releasePreview?.releaseDueAt || fundingSummary?.releaseDueAt;
                            const prefundStatus = (): { label: string; variant: 'success' | 'danger' | 'warning' | 'default' | 'info' | 'primary' } => {
                                if (prefundLine) { const status = lineStatus(prefundLine); return { label: status.label, variant: status.tone }; }
                                if (event.fundsReleasedAt) return { label: 'No-show · wage returned to you', variant: 'default' };
                                if (attended) return { label: releaseDue ? `Paid automatically ${formatDate(releaseDue)}` : 'Paid automatically after the event', variant: 'default' };
                                return talentRecords.some((att) => att.status === 'absent') ? { label: 'No-show · not paid', variant: 'danger' } : { label: 'Not checked in yet', variant: 'default' };
                            };
                            const paymentStatus: { label: string; variant: 'success' | 'danger' | 'warning' | 'default' | 'info' | 'primary' } | null = !showPaymentStatus && !(prefunded && user?.role === UserRole.PROVIDER) ? null
                                : prefunded ? prefundStatus()
                                : !attended ? { label: talentRecords.some((att) => att.status === 'absent') ? 'No-show · not paid' : 'Not checked in', variant: 'default' }
                                    : !paymentLine || !payment || payment.collectionStatus === 'not_started' ? { label: 'Not paid yet', variant: 'default' }
                                        : payment.collectionStatus === 'failed' ? { label: 'Payment error', variant: 'danger' }
                                            : payment.collectionStatus === 'pending' ? { label: 'Payment pending', variant: 'warning' }
                                                : payment.collectionStatus === 'refunded' ? { label: 'Refunded', variant: 'default' }
                                                    : paymentLine.payoutStatus === 'paid' ? { label: 'Paid', variant: 'success' }
                                                        : paymentLine.payoutStatus === 'failed' ? { label: 'Payout error', variant: 'danger' }
                                                            : paymentLine.payoutStatus === 'cash_due' ? { label: 'Cash due', variant: 'warning' }
                                                                : { label: 'Payout pending', variant: 'warning' };
                            const reviewed = reviewedUserIds.includes(app.talent.userId);
                            return (
                                <Card key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={app.talent.photo} name={app.talent.fullName} />
                                        <div>
                                            <p className="text-sm font-semibold text-dark-100">{app.talent.fullName}</p>
                                            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                                                 {record && <Badge variant={attVariant}>{record.status}</Badge>}
                                                 {eventDays.length > 1 && <Badge variant="default">{attendedDays}/{eventDays.length} days</Badge>}
                                                 {record && <Badge variant="info">{checkInMethodLabel(record.checkInMethod)}</Badge>}
                                                 {paymentStatus && <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>}
                                                 {app.talent.phoneNumber && (
                                                     <span className="text-xs text-dark-300 font-medium flex items-center gap-1">
                                                         <Phone size={11} className="text-dark-500" />
                                                         <a href={`tel:${app.talent.phoneNumber}`} className="hover:text-primary-500 transition-colors font-medium">{app.talent.phoneNumber}</a>
                                                     </span>
                                                 )}
                                                 {app.talent.whatsappNumber && (
                                                     <span className="text-xs text-dark-300 font-medium flex items-center gap-1">
                                                         <MessageCircle size={11} className="text-success-500" />
                                                         <a href={`https://wa.me/${app.talent.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-success-600 text-success-500 font-semibold transition-colors">
                                                             WhatsApp
                                                         </a>
                                                     </span>
                                                 )}
                                                 {app.talent.paymentMethods && app.talent.paymentMethods.find(m => m.isDefault) && (() => {
                                                     const defPay = app.talent.paymentMethods.find(m => m.isDefault)!;
                                                     return (
                                                         <span className="text-xs text-dark-300 font-medium bg-dark-800 border border-dark-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                             💳 {defPay.provider}{defPay.numberOrDetail ? `: ${defPay.numberOrDetail}` : ''}
                                                         </span>
                                                     );
                                                 })()}
                                             </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Staff can only check someone in, never mark absent or override the usher's own check-in. */}
                                        {!event.fundsReleasedAt && event.status !== EventStatus.CANCELLED && !(dayAttended && selfCheckIn(record)) && record?.status !== 'present' && (
                                            <>
                                                <Button size="sm" variant="secondary" disabled={Boolean(attendanceBusy)} isLoading={attendanceBusy === app.talentId} title="Use when the usher’s phone cannot check in" onClick={() => handleStaffCheckIn(app.talentId, 'present')}>
                                                    Check in
                                                </Button>
                                                {record?.status !== 'late' && (
                                                    <Button size="sm" variant="ghost" disabled={Boolean(attendanceBusy)} onClick={() => handleStaffCheckIn(app.talentId, 'late')}>
                                                        Late
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            icon={<Star size={14} className={reviewed ? 'fill-warning-400 text-warning-400' : undefined} />}
                                            disabled={reviewed}
                                            title={reviewed ? 'You already rated this usher' : undefined}
                                            onClick={() => setReviewModal({ open: true, talentUserId: app.talent.userId, talentName: app.talent.fullName })}
                                        >
                                            {reviewed ? 'Rated' : 'Rate'}
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            <Modal isOpen={reviewModal.open} onClose={() => setReviewModal({ open: false, talentUserId: '', talentName: '' })} title={`Rate ${reviewModal.talentName}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setReviewRating(n)}
                                    className={`w-10 h-10 rounded-xl border transition-all cursor-pointer ${n <= reviewRating ? 'bg-warning-500/20 border-warning-500/50 text-warning-400' : 'border-dark-700 text-dark-600 hover:border-dark-500'
                                        }`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-dark-300">Comment <span className="font-normal text-dark-500">(optional)</span></label>
                        <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Share your experience..."
                            className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                        />
                    </div>
                    {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
                    <Button isLoading={reviewBusy} onClick={handleSubmitReview} className="w-full">Submit Review</Button>
                </div>
            </Modal>

            {/* Re-book Talents Modal */}
            <Modal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} title="Re-book Talents to Event">
                {bookOptionsLoading ? <ContentSkeleton variant="form" /> : <div className="space-y-4">
                    {providerEvents.length === 0 ? (
                        <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/20 text-warning-400 text-sm">
                            No open events found. You must create an active, open event first to re-book talents.
                        </div>
                    ) : (
                        <Select
                            label="Select Target Event"
                            value={selectedTargetEventId}
                            onChange={(e) => setSelectedTargetEventId(e.target.value)}
                            options={providerEvents.map((e) => ({
                                value: e._id,
                                label: `${e.title} (${new Date(e.eventDate).toLocaleDateString()})`,
                            }))}
                        />
                    )}

                    <div className="border-t border-dark-800/60 pt-3 space-y-3">
                        <Input
                            label="Search Talents to Add"
                            placeholder="Type a name to search and add new talents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={<Search size={16} className="text-dark-500" />}
                        />

                        {searchQuery.trim() !== '' && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-dark-400 ">Search Results</p>
                                <div className="max-h-36 overflow-y-auto divide-y divide-dark-800 border border-dark-800 rounded-xl p-2 bg-dark-900/10 space-y-1.5">
                                    {allTalents
                                        .filter((t) =>
                                            t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
                                            !selectedTalents.some((st) => st._id === t._id)
                                        )
                                        .slice(0, 5)
                                        .map((talent) => (
                                            <div key={talent._id} className="flex items-center justify-between py-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Avatar name={talent.fullName} size="sm" src={talent.photo} />
                                                    <span className="text-sm font-medium text-dark-200">{talent.fullName}</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="py-1 px-2.5 text-xs flex items-center gap-1"
                                                    onClick={() => handleAddTalent(talent)}
                                                >
                                                    <Plus size={12} /> Add
                                                </Button>
                                            </div>
                                        ))}
                                    {allTalents.filter((t) =>
                                        t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
                                        !selectedTalents.some((st) => st._id === t._id)
                                    ).length === 0 && (
                                        <p className="text-xs text-dark-500 text-center py-2">No matching talents found.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-dark-400 ">
                                    Selected Talents to Re-book ({selectedTalents.length})
                                </p>
                                {selectedTalents.length > 0 && (
                                    <div className="w-full sm:w-48">
                                        <Input
                                            placeholder="Filter selected..."
                                            value={selectedSearchQuery}
                                            onChange={(e) => setSelectedSearchQuery(e.target.value)}
                                            icon={<Search size={12} className="text-dark-500" />}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="max-h-48 overflow-y-auto divide-y divide-dark-800 border border-dark-800 rounded-xl p-2 bg-dark-900/10 space-y-2">
                                {selectedTalents
                                    .filter((t) => t.fullName.toLowerCase().includes(selectedSearchQuery.toLowerCase()))
                                    .map((talent) => (
                                        <div key={talent._id} className="flex items-center justify-between py-1.5">
                                            <div className="flex items-center gap-2">
                                                <Avatar name={talent.fullName} size="sm" src={talent.photo} />
                                                <div>
                                                    <p className="text-sm font-semibold text-dark-200 leading-tight">{talent.fullName}</p>
                                                    <p className="text-xs text-dark-500">Reliability: {talent.reliabilityScore}% · Rating: {talent.ratingAverage}★</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleExcludeTalent(talent._id)}
                                                className="p-1.5 text-danger-500 hover:bg-danger-500/10 rounded-lg transition-colors cursor-pointer"
                                                title="Exclude talent"
                                            >
                                                <Minus size={14} />
                                            </button>
                                        </div>
                                    ))}
                                {selectedTalents.length === 0 && (
                                    <p className="text-xs text-dark-500 text-center py-4">No talents selected to re-book. Add talent using the search above.</p>
                                )}
                                {selectedTalents.length > 0 && selectedTalents.filter((t) => t.fullName.toLowerCase().includes(selectedSearchQuery.toLowerCase())).length === 0 && (
                                    <p className="text-xs text-dark-500 text-center py-4">No matching selected talents found.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                        <Button variant="secondary" onClick={() => setBookModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleBookSubmit}
                            isLoading={bookSubmitting}
                            disabled={providerEvents.length === 0 || selectedTalents.length === 0}
                            icon={<Send size={14} />}
                        >
                            Re-book Talents
                        </Button>
                    </div>
                </div>}
            </Modal>

            {/* Pay-all settlement modal */}
            <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Pay all ushers">
                <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-sm text-warning-500">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Paymob test mode</p>
                            <p className="mt-0.5 text-xs">No live money will move while the test credentials are enabled.</p>
                        </div>
                    </div>

                    {paymentLoading && !settlementPreview ? (
                        <ContentSkeleton variant="dashboard" />
                    ) : paymentError && !settlementPreview ? (
                        <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-sm text-danger-500">{paymentError}</div>
                    ) : settlementPreview && (
                        <>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-dark-700 bg-dark-900/20 p-3">
                                    <p className="text-xs font-semibold text-dark-400">Event total</p>
                                    <p className="mt-1 font-bold text-dark-50">{settlementPreview.grossAmount} EGP</p>
                                </div>
                                <div className="rounded-xl border border-primary-500/25 bg-primary-500/5 p-3">
                                    <p className="text-xs font-semibold text-dark-400">{individualSettlements.length ? 'Estimated Paymob total' : 'Paymob charge'}</p>
                                    <p className="mt-1 font-bold text-primary-500">{paymobCharge} EGP</p>
                                </div>
                                <div className="rounded-xl border border-success-500/25 bg-success-500/5 p-3">
                                    <p className="text-xs font-semibold text-dark-400">Usher payouts</p>
                                    <p className="mt-1 font-bold text-success-500">{settlementPreview.usherAmount} EGP</p>
                                </div>
                                <div className="rounded-xl border border-warning-500/25 bg-warning-500/5 p-3">
                                    <p className="text-xs font-semibold text-dark-400">Cash due</p>
                                    <p className="mt-1 font-bold text-warning-500">{cashDue} EGP</p>
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-bold text-dark-400">Payment breakdown</p>
                                {individualSettlements.length > 0 && <p className="mb-2 text-xs text-warning-500">Individual checkout has started for this event. Complete remaining ushers individually.</p>}
                                <p className="mb-2 text-xs text-dark-400">After Paymob confirms your checkout, automatic payouts start for every usher with a supported payout account. Cash is used only for the ushers shown below.</p>
                                {!lockedSettlement && <p className="mb-2 text-xs text-dark-400">Select Pay in cash instead for any usher you want to pay directly, even if they have a payout account.</p>}
                                {notPayable.length > 0 && (
                                    <p className="mb-2 rounded-lg border border-dark-700 bg-dark-900/20 p-2 text-xs text-dark-300">
                                        Not included: {notPayable.map(({ app, status }) => `${app.talent.fullName} (${status === 'absent' ? 'absent' : 'attendance not marked'})`).join(', ')}.
                                    </p>
                                )}
                                <div className="max-h-72 space-y-2 overflow-y-auto pe-1">
                                    {paymentLines.map((line) => {
                                        const savedLine = '_id' in line;
                                        const isCash = line.payoutMethodType === 'cash';
                                        const name = savedLine ? line.talent.fullName : line.talentName;
                                        const individualPayment = individualSettlements.find((item) => item.targetTalentId === line.talentId);
                                        const linePayment = individualPayment || (savedLine ? settlement : null);
                                        const canStartIndividual = (!settlement || settlement.collectionStatus === 'failed')
                                            && (!individualPayment || individualPayment.collectionStatus === 'failed');
                                        return (
                                            <div
                                                key={savedLine ? line._id : line.talentId}
                                                className={`rounded-xl border p-3 ${isCash ? 'border-warning-500/40 bg-warning-500/10' : 'border-dark-700 bg-dark-900/20'}`}
                                            >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-bold text-dark-50">{name}</p>
                                                            <Badge variant={line.attendanceStatus === 'late' ? 'warning' : 'success'}>{line.attendanceStatus}</Badge>
                                                            {eventDays.length > 1 && 'attendedDays' in line && line.attendedDays !== undefined && (
                                                                <Badge variant="default">{line.attendedDays}/{eventDays.length} days</Badge>
                                                            )}
                                                            {isCash && <Badge variant="warning">CASH</Badge>}
                                                            {!savedLine && <Badge variant="default">Not paid yet</Badge>}
                                                        </div>
                                                        <p className="mt-1 text-xs text-dark-400">
                                                            Receives {line.usherAmount} EGP · 5% fee: {line.platformFee} EGP
                                                            {!isCash && ` · ${line.payoutProvider || line.payoutMethodType} ${line.payoutDestinationMasked || ''}`}
                                                        </p>
                                                        {isCash && (
                                                            <p className="mt-1 text-xs font-semibold text-warning-500">
                                                                Pay {line.usherAmount} EGP in cash.
                                                            </p>
                                                        )}
                                                        {savedLine && line.failureReason && <p className="mt-1 text-xs text-danger-500">{line.failureReason}</p>}
                                                        {savedLine && linePayment?.collectionStatus === 'paid' && line.payoutStatus === 'failed' && !line.payoutRetrySafe && (
                                                            <p className="mt-1 text-xs text-warning-500">Confirm this payout with support before retrying to avoid sending it twice.</p>
                                                        )}
                                                        {individualPayment?.collectionStatus === 'failed' && individualPayment.collectionFailureReason && (
                                                            <p className="mt-1 text-xs text-danger-500">{individualPayment.collectionFailureReason}</p>
                                                        )}
                                                    </div>
                                                    {!individualPayment && !savedLine && settlementPreview.lines.some((previewLine) => previewLine.talentId === line.talentId && previewLine.payoutMethodType !== 'cash') && !lockedSettlement && (
                                                        <label className="flex items-center gap-2 text-xs text-dark-200">
                                                            <input type="checkbox" checked={cashTalentIds.includes(line.talentId)}
                                                                onChange={(event) => setCashTalentIds((ids) => event.target.checked ? [...ids, line.talentId] : ids.filter((id) => id !== line.talentId))}
                                                                disabled={paymentLoading} />
                                                            Pay in cash instead
                                                        </label>
                                                    )}
                                                    {savedLine && (
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={linePayment?.collectionStatus === 'failed' || (linePayment?.collectionStatus === 'paid' && line.payoutStatus === 'failed') ? 'danger' : linePayment?.collectionStatus === 'paid' && line.payoutStatus === 'paid' ? 'success' : 'warning'}>
                                                                {linePayment?.collectionStatus === 'failed' ? 'Payment error'
                                                                    : linePayment?.collectionStatus === 'pending' ? 'Checkout pending'
                                                                        : linePayment?.collectionStatus === 'paid' ? line.payoutStatus === 'paid' ? 'Paid'
                                                                            : line.payoutStatus === 'failed' ? 'Payout error' : line.payoutStatus.replace('_', ' ')
                                                                            : 'Not paid yet'}
                                                            </Badge>
                                                            {isCash && linePayment?.collectionStatus === 'paid' && line.payoutStatus !== 'paid' && (
                                                                <Button size="sm" variant="secondary" className="border-warning-500/40 text-warning-500" onClick={() => handleMarkCashPaid(line._id, linePayment)} disabled={paymentLoading}>
                                                                    Mark cash paid
                                                                </Button>
                                                            )}
                                                            {!isCash && linePayment?.collectionStatus === 'paid' && line.payoutStatus === 'failed' && line.payoutRetrySafe && (
                                                                <Button size="sm" variant="secondary" onClick={() => handleRetryPayout(linePayment, line._id)} disabled={paymentLoading}>Retry payout</Button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {canStartIndividual && (
                                                        <Button size="sm" variant="secondary" onClick={() => handlePayIndividual(line.talentId)} disabled={paymentLoading || (!isCash && !settlementPreview.payoutSandboxConfigured)}>
                                                            {individualPayment ? 'Retry usher checkout' : 'Pay this usher'}
                                                        </Button>
                                                    )}
                                                    {individualPayment && hasActiveCheckout(individualPayment) && (
                                                        <Button size="sm" variant="secondary" onClick={() => handlePayIndividual(line.talentId)} disabled={paymentLoading}>Continue usher checkout</Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {cashDue > 0 && (
                                <p className="rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-xs text-warning-500">
                                    For cash ushers, Paymob collects only OO-Ushers&apos; 5% fee. You give their remaining 95% to them in cash, so you are never charged twice.
                                </p>
                            )}

                            {automaticPayoutsUnavailable && (
                                <p role="alert" className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-3 text-xs text-danger-500">
                                    Automatic Paymob payouts are not connected yet. Checkout is unavailable until the Payouts sandbox is configured for ushers receiving digital payments.
                                </p>
                            )}

                            <fieldset className="rounded-xl border border-dark-700 p-3 text-sm text-dark-300">
                                <legend className="px-1 font-semibold text-dark-100">Pay with</legend>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 rounded-lg border border-dark-700 p-3 ${hasActiveCheckout(settlement) || paymentLoading ? 'opacity-60' : 'cursor-pointer'}`}>
                                        <input type="radio" name="payment-card" value="" checked={!selectedCardId} onChange={() => setSelectedCardId('')} disabled={hasActiveCheckout(settlement) || paymentLoading} />
                                        <span>New card or other Paymob method</span>
                                    </label>
                                    {settlementPreview.savedCards.map((card) => (
                                        <label key={card._id} className={`flex items-center gap-3 rounded-lg border border-dark-700 p-3 ${hasActiveCheckout(settlement) || paymentLoading ? 'opacity-60' : 'cursor-pointer'}`}>
                                            <input type="radio" name="payment-card" value={card._id} checked={selectedCardId === card._id} onChange={() => setSelectedCardId(card._id)} disabled={hasActiveCheckout(settlement) || paymentLoading} />
                                            <span>{card.cardSubtype || 'Card'} {card.maskedPan}{card.isDefault ? ' · Default' : ''}</span>
                                        </label>
                                    ))}
                                </div>
                                {hasActiveCheckout(settlement) ? (
                                    <p className="mt-2 text-xs text-warning-500">An earlier checkout is still active, so its payment method is locked. Continue that checkout or choose a card after it expires at {new Date(settlement!.expiresAt!).toLocaleTimeString()}.</p>
                                ) : settlementPreview.savedCards.length === 0 ? (
                                    <p className="mt-2 text-xs text-dark-400">No saved card is available yet. Complete Add card in <Link className="underline" href="/provider/profile">Company Profile</Link>, then reopen this payment panel.</p>
                                ) : (
                                    <p className="mt-2 text-xs text-dark-400">Paymob may still ask you to verify a saved card.</p>
                                )}
                            </fieldset>

                            {paymentError && <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-500">{paymentError}</div>}

                            <div className="flex flex-col-reverse gap-3 border-t border-dark-700 pt-4 sm:flex-row sm:justify-end">
                                <Button variant="secondary" onClick={() => setPayModalOpen(false)}>Close</Button>
                                {settlement?.collectionStatus !== 'paid' && individualSettlements.length === 0 && (
                                    <Button variant="primary" onClick={handleContinueToCheckout} isLoading={paymentLoading} disabled={Boolean(automaticPayoutsUnavailable)} icon={<CreditCard size={15} />}>
                                        Continue to Paymob Test Checkout
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {editOpen && (
                <EditEventModal
                    event={event}
                    onClose={() => setEditOpen(false)}
                    onSaved={() => void fetchData()}
                />
            )}
        </div>
    );
}
