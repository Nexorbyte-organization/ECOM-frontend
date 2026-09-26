'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getEvent, getEventApplicants, getEventAttendance, updateApplicationStatus,
    markAttendance, submitReview, isVerifiedTalent,
    getStaffMembers, assignSupervisorToEvent, getAllTalents,
    getProviderProfileByUserId, getProviderEvents, directBookTalent,
    requestEventAction, updateEvent, deleteEvent,
    createEventSettlement, getEventSettlement, getEventSettlementPreview,
    getOrganizerCards,
    markCashSettlementLinePaid,
    generateEventAttendanceQr, getEventAttendanceQr,
} from '@/lib/api';
import { Event, Application, TalentProfile, Attendance, AttendanceQr, ApplicationStatus, AttendanceStatus, User, UserRole, EventActionRequestType, EventStatus, EventSettlement, EventSettlementPreview } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import {
    MapPin, Clock, Users, Shirt, FileText, ArrowLeft, Check, X,
    UserCheck, Star, CalendarX, Search, Plus, Minus, Send, Phone, MessageCircle, CreditCard,
    XCircle, Trash2, AlertTriangle, QrCode, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { QRCodeSVG } from 'qrcode.react';

const hasActiveCheckout = (settlement: EventSettlement | null) => Boolean(
    settlement?.collectionStatus === 'pending'
    && settlement.checkoutUrl
    && settlement.expiresAt
    && Date.parse(settlement.expiresAt) > Date.now()
);

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
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [settlementPreview, setSettlementPreview] = useState<EventSettlementPreview | null>(null);
    const [settlement, setSettlement] = useState<EventSettlement | null>(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [attendanceQr, setAttendanceQr] = useState<AttendanceQr | null>(null);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState('');
    const [selectedCardId, setSelectedCardId] = useState('');

    const [supervisors, setSupervisors] = useState<Omit<User, 'password'>[]>([]);
    const [assigning, setAssigning] = useState(false);

    const [bookModalOpen, setBookModalOpen] = useState(false);
    const [providerEvents, setProviderEvents] = useState<Event[]>([]);
    const [selectedTargetEventId, setSelectedTargetEventId] = useState('');
    const [selectedTalents, setSelectedTalents] = useState<TalentProfile[]>([]);
    const [allTalents, setAllTalents] = useState<TalentProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSearchQuery, setSelectedSearchQuery] = useState('');
    const [bookSubmitting, setBookSubmitting] = useState(false);

    // Cancel / Delete state
    const [actionModal, setActionModal] = useState<{
        open: boolean;
        type: 'cancel' | 'delete' | null;
        mode: 'direct' | 'request';
    }>({ open: false, type: null, mode: 'direct' });
    const [actionReason, setActionReason] = useState('');
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [actionSuccess, setActionSuccess] = useState('');

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
        setApplicants(apps);
        setAttendanceRecords(att);
        setSupervisors(staff.filter((s) => s.role === UserRole.PROVIDER_SUPERVISOR));
        // Sync WhatsApp link input with saved event value
        setWaLink(e?.whatsappGroupLink ?? '');
        if (e?.status === EventStatus.COMPLETED && user?.role === UserRole.PROVIDER) {
            setSettlement(await getEventSettlement(id));
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
            alert(err instanceof Error ? err.message : 'Failed to update supervisor assignment');
        } finally {
            setAssigning(false);
        }
    };

    const openActionModal = (type: 'cancel' | 'delete') => {
        if (!event) return;
        const isOpen = event.status === EventStatus.OPEN;
        setActionModal({ open: true, type, mode: isOpen ? 'direct' : 'request' });
        setActionReason('');
        setActionSuccess('');
    };

    const handleConfirmAction = async () => {
        if (!event || !actionModal.type) return;
        setActionSubmitting(true);
        try {
            if (actionModal.mode === 'direct') {
                // Event is open — provider can act directly
                if (actionModal.type === 'cancel') {
                    await updateEvent(event._id, { status: EventStatus.CANCELLED });
                    setActionSuccess('Event cancelled successfully.');
                } else {
                    await deleteEvent(event._id);
                    setActionModal({ open: false, type: null, mode: 'direct' });
                    router.push('/provider/events');
                    return;
                }
            } else {
                // Non-open event — submit a request to admin
                const reqType = actionModal.type === 'cancel'
                    ? EventActionRequestType.CANCEL
                    : EventActionRequestType.DELETE;
                await requestEventAction(event._id, reqType, actionReason || undefined);
                setActionSuccess(
                    actionModal.type === 'cancel'
                        ? 'Cancellation request submitted. An admin will review it shortly.'
                        : 'Deletion request submitted. An admin will review it shortly.'
                );
            }
            await fetchData();
            setTimeout(() => {
                setActionModal({ open: false, type: null, mode: 'direct' });
                setActionSuccess('');
            }, 2000);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActionSubmitting(false);
        }
    };

    const handleSaveWhatsAppLink = async () => {
        if (!event) return;
        setWaLinkSaving(true);
        try {
            await updateEvent(event._id, { whatsappGroupLink: waLink.trim() || undefined });
            await fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Failed to save WhatsApp group link');
        } finally {
            setWaLinkSaving(false);
        }
    };

    const handleOpenBookModal = async () => {
        if (!event || !user) return;
        setSearchQuery('');
        setSelectedSearchQuery('');
        setBookSubmitting(false);
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
            alert(err instanceof Error ? err.message : 'Failed to initialize booking list');
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
            alert('Please select a target event to book talents to.');
            return;
        }
        if (selectedTalents.length === 0) {
            alert('Please select at least one talent to book.');
            return;
        }
        setBookSubmitting(true);
        try {
            // Bulk call directBookTalent
            await Promise.all(
                selectedTalents.map((t) => directBookTalent(selectedTargetEventId, t._id))
            );
            alert(`Successfully booked ${selectedTalents.length} talents!`);
            setBookModalOpen(false);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Failed to send bookings.');
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
        setError('');
        try {
            await updateApplicationStatus(appId, status);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not update application.');
        }
    };

    const handleMarkAttendance = async (talentId: string, status: AttendanceStatus) => {
        if (!event) return;
        setError('');
        try {
            await markAttendance(event._id, talentId, status);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not mark attendance.');
        }
    };

    const handleOpenAttendanceQr = async () => {
        if (!event) return;
        setQrModalOpen(true);
        setQrLoading(true);
        setQrError('');
        try {
            const qr = event.attendanceQrGenerated
                ? await getEventAttendanceQr(event._id)
                : await generateEventAttendanceQr(event._id);
            setAttendanceQr(qr);
            setEvent((current) => current ? { ...current, attendanceQrGenerated: true } : current);
        } catch (err) {
            setQrError(err instanceof Error ? err.message : 'Could not load the attendance QR.');
        } finally {
            setQrLoading(false);
        }
    };

    const handleOpenPayAll = async () => {
        if (!event) return;
        setPaymentLoading(true);
        setPaymentError('');
        setPayModalOpen(true);
        try {
            const preview = await getEventSettlementPreview(event._id);
            const currentSettlement = await getEventSettlement(event._id);
            const savedCards = await getOrganizerCards().catch(() => preview.savedCards);
            setSettlementPreview({ ...preview, savedCards });
            setSettlement(currentSettlement);
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
        setPaymentLoading(true);
        setPaymentError('');
        try {
            const cardId = hasActiveCheckout(settlement)
                ? settlement?.selectedCardId || undefined
                : selectedCardId || undefined;
            const nextSettlement = await createEventSettlement(event._id, cardId);
            setSettlement(nextSettlement);
            if (!nextSettlement.checkoutUrl) throw new Error('Paymob did not return a checkout link.');
            window.location.assign(nextSettlement.checkoutUrl);
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Could not start Paymob Test checkout.');
            setPaymentLoading(false);
        }
    };

    const handleMarkCashPaid = async (lineId: string) => {
        if (!settlement) return;
        setPaymentLoading(true);
        setPaymentError('');
        try {
            setSettlement(await markCashSettlementLinePaid(settlement._id, lineId));
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Could not record the cash payment.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!user || !event) return;
        setError('');
        try {
            await submitReview({
                eventId: event._id,
                reviewerId: user._id,
                reviewedUserId: reviewModal.talentUserId,
                rating: reviewRating,
                comment: reviewComment,
            });
            setReviewModal({ open: false, talentUserId: '', talentName: '' });
            setReviewRating(5);
            setReviewComment('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not submit review.');
        }
    };

    const statusVariant = (s: string) =>
        s === 'open' ? 'success' as const : s === 'confirmed' ? 'primary' as const : s === 'completed' ? 'default' as const : 'danger' as const;

    if (loading) return <div className="max-w-4xl mx-auto"><div className="h-96 glass rounded-2xl animate-pulse" /></div>;

    if (!event) return (
        <div className="text-center py-20">
            <p className="text-dark-400">{error || 'Event not found'}</p>
            <Link href="/provider/events" className="text-primary-400 text-sm mt-2 inline-block">← Back to events</Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
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
                                <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(event.eventDate)} · {event.startTime}-{event.endTime}</span>
                                <span className="flex items-center gap-1"><Users size={12} /> {event.hiredTalents.length}/{event.requiredCount}</span>
                                <span className={`flex items-center gap-1 ${new Date() > new Date(event.applicationDeadline) ? 'text-danger-400' : ''}`}>
                                    <CalendarX size={12} /> Deadline: {formatDate(event.applicationDeadline)} {new Date() > new Date(event.applicationDeadline) && '(Expired)'}
                                </span>
                            </div>
                        </div>
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


                        {/* Cancel & Delete — available to organizers only */}
                        {user?.role === UserRole.PROVIDER && event.status !== EventStatus.CANCELLED && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<XCircle size={15} />}
                                    onClick={() => openActionModal('cancel')}
                                    className="text-danger-500 hover:bg-danger-50 border border-danger-200"
                                >
                                    {event.status === EventStatus.OPEN ? 'Cancel Event' : 'Request Cancel'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Trash2 size={15} />}
                                    onClick={() => openActionModal('delete')}
                                    className="text-danger-500 hover:bg-danger-50 border border-danger-200"
                                >
                                    {event.status === EventStatus.OPEN ? 'Delete' : 'Request Delete'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {user?.role === UserRole.PROVIDER && (
                <Card className="border-primary-500/25">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-500/10 text-primary-400">
                                <QrCode size={20} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="font-bold text-dark-50">Attendance QR</h2>
                                    {event.attendanceQrGenerated && <Badge variant="success">Generated</Badge>}
                                </div>
                                <p className="mt-1 max-w-xl text-sm text-dark-400">
                                    Display this code at the venue. Hired ushers who scan it are marked present automatically.
                                </p>
                                {!event.attendanceQrGenerated && event.status !== EventStatus.OPEN && (
                                    <p className="mt-2 text-xs font-medium text-warning-400">
                                        A QR cannot be generated after the event is closed.
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant={event.attendanceQrGenerated ? 'secondary' : 'primary'}
                            icon={<QrCode size={16} />}
                            onClick={handleOpenAttendanceQr}
                            disabled={!event.attendanceQrGenerated && event.status !== EventStatus.OPEN}
                            className="shrink-0"
                        >
                            {event.attendanceQrGenerated ? 'View QR' : 'Generate QR'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Tabs */}
            {(() => {
                const deadlinePassed = new Date() > new Date(event.applicationDeadline);
                const eventClosed = event.status !== 'open';
                const canTakeAttendance = deadlinePassed || eventClosed;
                return (
                    <div className="flex gap-2">
                        {[
                            { key: 'details' as const, label: 'Details', disabled: false },
                            { key: 'applicants' as const, label: `Applicants (${applicants.length})`, disabled: false },
                            { key: 'attendance' as const, label: 'Attendance', disabled: !canTakeAttendance },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => !t.disabled && setActiveTab(t.key)}
                                disabled={t.disabled}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${t.disabled
                                    ? 'text-dark-600 border-dark-800 cursor-not-allowed opacity-50'
                                    : activeTab === t.key
                                        ? 'bg-primary-500/15 text-primary-300 border-primary-500/30 cursor-pointer'
                                        : 'text-dark-400 border-dark-700 hover:border-dark-600 cursor-pointer'
                                    }`}
                                title={t.disabled ? 'Available after application deadline passes or event is closed' : ''}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                );
            })()}

            {/* Tab Content */}
            {activeTab === 'details' && (
                <Card>
                    <div className="space-y-4">
                        {event.dressCode && (
                            <div>
                                <div className="flex items-center gap-2 mb-1"><Shirt size={14} className="text-dark-400" /><p className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Dress Code</p></div>
                                <p className="text-sm text-dark-200">{event.dressCode}</p>
                            </div>
                        )}
                        {event.notes && (
                            <div>
                                <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-dark-400" /><p className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Notes</p></div>
                                <p className="text-sm text-dark-200">{event.notes}</p>
                            </div>
                        )}
                        {event.gatheringLocation && (
                            <div>
                                <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">Gathering Location</p>
                                <p className="text-sm text-dark-200">{event.gatheringLocation}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">Gender Requirement</p>
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
                                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <MessageCircle size={14} className="text-emerald-555" />
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
                                        className="bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white font-bold h-[38px] px-4 rounded-xl shrink-0"
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
                                <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <MessageCircle size={14} className="text-emerald-555" />
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
                                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Event Supervisors</label>
                                {supervisors.length === 0 ? (
                                    <p className="text-xs text-dark-500 italic">No supervisors in your team yet. Invite a supervisor from the Staff page.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {supervisors.map((s) => {
                                            const isAssigned = (event.supervisorIds ?? []).includes(s._id);
                                            return (
                                                <button
                                                    key={s._id}
                                                    disabled={assigning}
                                                    onClick={() => handleToggleSupervisor(s._id, !isAssigned)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                                                        isAssigned
                                                            ? 'bg-primary-500/15 border-primary-500/40 text-primary-400 hover:bg-danger-500/10 hover:border-danger-500/30 hover:text-danger-400'
                                                            : 'bg-dark-900/10 border-dark-700 text-dark-400 hover:border-primary-500/40 hover:text-primary-400 hover:bg-primary-500/10'
                                                    }`}
                                                    title={isAssigned ? `Remove ${s.fullName || s.email} from supervisors` : `Add ${s.fullName || s.email} as supervisor`}
                                                >
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
                                    <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Assigned Supervisors</p>
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
                <div className="space-y-3 stagger-children">
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
                                                    <MessageCircle size={11} className="text-emerald-500" />
                                                    <a href={`https://wa.me/${app.talent.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 text-emerald-500 font-semibold transition-colors">
                                                        WhatsApp
                                                    </a>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge variant="primary">{app.talent.reliabilityScore}% reliable</Badge>
                                            <Badge variant="warning">{app.talent.ratingAverage} ★</Badge>
                                            {isVerifiedTalent(app.talent) && <Badge variant="success">✅ Verified</Badge>}
                                            {app.isDirect && <Badge variant="info">Direct</Badge>}
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
                                    {app.status === 'pending' ? (
                                        <>
                                            <Button size="sm" variant="success" icon={<Check size={14} />} onClick={() => handleApplicationAction(app._id, ApplicationStatus.ACCEPTED)}>
                                                Accept
                                            </Button>
                                            <Button size="sm" variant="danger" icon={<X size={14} />} onClick={() => handleApplicationAction(app._id, ApplicationStatus.REJECTED)}>
                                                Reject
                                            </Button>
                                        </>
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
                    {event.status === EventStatus.COMPLETED && user?.role === UserRole.PROVIDER && (
                        <Card className="border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-transparent">
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
                                    {settlement?.collectionStatus === 'paid' ? 'View payments' : 'Pay all ushers'}
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
                            const record = attendanceRecords.find((att) => att.talentId === app.talentId);
                            const attVariant = record?.status === 'present' ? 'success' as const : record?.status === 'late' ? 'warning' as const : record?.status === 'absent' ? 'danger' as const : 'default' as const;
                            return (
                                <Card key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={app.talent.photo} name={app.talent.fullName} />
                                        <div>
                                            <p className="text-sm font-semibold text-dark-100">{app.talent.fullName}</p>
                                            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                                                 {record && <Badge variant={attVariant}>{record.status}</Badge>}
                                                 {app.talent.phoneNumber && (
                                                     <span className="text-xs text-dark-300 font-medium flex items-center gap-1">
                                                         <Phone size={11} className="text-dark-500" />
                                                         <a href={`tel:${app.talent.phoneNumber}`} className="hover:text-primary-500 transition-colors font-medium">{app.talent.phoneNumber}</a>
                                                     </span>
                                                 )}
                                                 {app.talent.whatsappNumber && (
                                                     <span className="text-xs text-dark-300 font-medium flex items-center gap-1">
                                                         <MessageCircle size={11} className="text-emerald-500" />
                                                         <a href={`https://wa.me/${app.talent.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 text-emerald-500 font-semibold transition-colors">
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
                                        <Button size="sm" variant={record?.status === 'present' ? 'success' : 'secondary'} onClick={() => handleMarkAttendance(app.talentId, AttendanceStatus.PRESENT)}>
                                            Present
                                        </Button>
                                        <Button size="sm" variant={record?.status === 'late' ? 'success' : 'secondary'} onClick={() => handleMarkAttendance(app.talentId, AttendanceStatus.LATE)}>
                                            Late
                                        </Button>
                                        <Button size="sm" variant={record?.status === 'absent' ? 'danger' : 'secondary'} onClick={() => handleMarkAttendance(app.talentId, AttendanceStatus.ABSENT)}>
                                            Absent
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            icon={<Star size={14} />}
                                            onClick={() => setReviewModal({ open: true, talentUserId: app.talent.userId, talentName: app.talent.fullName })}
                                        >
                                            Rate
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* Attendance QR Modal */}
            <Modal
                isOpen={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                title="Attendance QR"
            >
                <div className="text-center">
                    {qrLoading && (
                        <div className="space-y-3 py-14" role="status">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-dark-700 border-t-primary-500" />
                            <p className="text-sm text-dark-400">Preparing the event QR...</p>
                        </div>
                    )}
                    {qrError && (
                        <div className="space-y-4 py-8" role="alert">
                            <XCircle size={44} className="mx-auto text-danger-500" />
                            <p className="text-sm text-danger-400">{qrError}</p>
                        </div>
                    )}
                    {attendanceQr && !qrLoading && !qrError && (
                        <div className="space-y-5">
                            <div className="mx-auto w-fit rounded-lg bg-white p-4">
                                <QRCodeSVG
                                    value={attendanceQr.checkInUrl}
                                    size={248}
                                    level="H"
                                    marginSize={1}
                                    title={`Attendance check-in for ${event.title}`}
                                />
                            </div>
                            <div className="flex items-start justify-center gap-2 text-sm text-dark-300">
                                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-success-500" />
                                <p className="max-w-sm text-left">
                                    This is the only attendance QR for this event. Keep it visible to hired ushers at check-in.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

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
                        <label className="block text-sm font-medium text-dark-300">Comment</label>
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
                    <Button onClick={handleSubmitReview} className="w-full">Submit Review</Button>
                </div>
            </Modal>

            {/* Re-book Talents Modal */}
            <Modal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} title="Re-book Talents to Event">
                <div className="space-y-4">
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
                                <p className="text-xs font-semibold text-dark-400 uppercase">Search Results</p>
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
                                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
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
                </div>
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
                        <div className="py-10 text-center text-sm text-dark-400">Preparing the event settlement…</div>
                    ) : paymentError && !settlementPreview ? (
                        <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-sm text-danger-500">{paymentError}</div>
                    ) : settlementPreview && (
                        <>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-dark-700 bg-dark-900/20 p-3">
                                    <p className="text-[11px] font-semibold uppercase text-dark-400">Event total</p>
                                    <p className="mt-1 font-bold text-dark-50">{settlementPreview.grossAmount} EGP</p>
                                </div>
                                <div className="rounded-xl border border-primary-500/25 bg-primary-500/5 p-3">
                                    <p className="text-[11px] font-semibold uppercase text-dark-400">Paymob charge</p>
                                    <p className="mt-1 font-bold text-primary-500">{settlementPreview.collectionAmount} EGP</p>
                                </div>
                                <div className="rounded-xl border border-success-500/25 bg-success-500/5 p-3">
                                    <p className="text-[11px] font-semibold uppercase text-dark-400">Usher payouts</p>
                                    <p className="mt-1 font-bold text-success-500">{settlementPreview.usherAmount} EGP</p>
                                </div>
                                <div className="rounded-xl border border-warning-500/25 bg-warning-500/5 p-3">
                                    <p className="text-[11px] font-semibold uppercase text-dark-400">Cash due</p>
                                    <p className="mt-1 font-bold text-warning-500">{settlementPreview.cashDueAmount} EGP</p>
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-dark-400">Payment breakdown</p>
                                <div className="max-h-72 space-y-2 overflow-y-auto pe-1">
                                    {(settlement?.lines || settlementPreview.lines).map((line) => {
                                        const savedLine = '_id' in line;
                                        const isCash = line.payoutMethodType === 'cash';
                                        const name = savedLine ? line.talent.fullName : line.talentName;
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
                                                            {isCash && <Badge variant="warning">CASH</Badge>}
                                                        </div>
                                                        <p className="mt-1 text-xs text-dark-400">
                                                            Receives {line.usherAmount} EGP · 5% fee: {line.platformFee} EGP
                                                            {!isCash && ` · ${line.payoutProvider || line.payoutMethodType} ${line.payoutDestinationMasked || ''}`}
                                                        </p>
                                                        {isCash && (
                                                            <p className="mt-1 text-xs font-semibold text-warning-500">
                                                                No supported payout account. Pay {line.usherAmount} EGP in cash.
                                                            </p>
                                                        )}
                                                        {savedLine && line.failureReason && <p className="mt-1 text-xs text-danger-500">{line.failureReason}</p>}
                                                    </div>
                                                    {savedLine && (
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={line.payoutStatus === 'paid' ? 'success' : line.payoutStatus === 'failed' ? 'danger' : isCash ? 'warning' : 'primary'}>
                                                                {line.payoutStatus.replace('_', ' ')}
                                                            </Badge>
                                                            {isCash && settlement?.collectionStatus === 'paid' && line.payoutStatus !== 'paid' && (
                                                                <Button size="sm" variant="secondary" className="border-warning-500/40 text-warning-500" onClick={() => handleMarkCashPaid(line._id)} disabled={paymentLoading}>
                                                                    Mark cash paid
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {settlementPreview.cashDueAmount > 0 && (
                                <p className="rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-xs text-warning-500">
                                    For cash ushers, Paymob collects only OO-Ushers&apos; 5% fee. You give their remaining 95% to them in cash, so you are never charged twice.
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
                                {settlement?.collectionStatus !== 'paid' && (
                                    <Button variant="primary" onClick={handleContinueToCheckout} isLoading={paymentLoading} icon={<CreditCard size={15} />}>
                                        Continue to Paymob Test Checkout
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Cancel / Delete Action Modal */}
            <Modal
                isOpen={actionModal.open}
                onClose={() => setActionModal({ open: false, type: null, mode: 'direct' })}
                title={
                    actionModal.type === 'cancel'
                        ? actionModal.mode === 'direct' ? 'Cancel Event' : 'Request Event Cancellation'
                        : actionModal.mode === 'direct' ? 'Delete Event' : 'Request Event Deletion'
                }
            >
                <div className="space-y-4">
                    {actionSuccess ? (
                        <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/20 text-success-400 text-sm text-center animate-fade-in">
                            ✅ {actionSuccess}
                        </div>
                    ) : (
                        <>
                            {/* Mode context banner */}
                            {actionModal.mode === 'request' ? (
                                <div className="p-3 rounded-xl bg-warning-500/10 border border-warning-500/20 text-warning-400 text-sm flex items-start gap-2">
                                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                        This event is <strong>not open</strong> — a direct {actionModal.type} is not allowed.
                                        Your request will be sent to an admin for review. You&apos;ll see the result reflected once they decide.
                                    </span>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm flex items-start gap-2">
                                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                        {actionModal.type === 'cancel'
                                            ? 'This will immediately cancel the event and notify all accepted talents.'
                                            : 'This will permanently delete the event and all associated applications. This cannot be undone.'}
                                    </span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-dark-300">
                                    {actionModal.mode === 'request' ? 'Reason for request' : 'Reason (optional)'}
                                </label>
                                <textarea
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    rows={3}
                                    placeholder={actionModal.mode === 'request'
                                        ? 'Explain why you need to ' + actionModal.type + ' this event...'
                                        : 'Optional: provide a reason...'}
                                    className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setActionModal({ open: false, type: null, mode: 'direct' })}
                                >
                                    Go Back
                                </Button>
                                <Button
                                    variant="danger"
                                    className="flex-1"
                                    isLoading={actionSubmitting}
                                    disabled={actionModal.mode === 'request' && !actionReason.trim()}
                                    onClick={handleConfirmAction}
                                >
                                    {actionModal.mode === 'direct'
                                        ? actionModal.type === 'cancel' ? 'Cancel Event' : 'Delete Event'
                                        : 'Submit Request'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
