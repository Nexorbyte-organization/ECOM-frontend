'use client';

import { toast } from '@/lib/toast';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getEvent, applyToEvent, acceptBookingInvitation, declineBookingInvitation, getTalentProfileByUserId, getTalentApplications, isVerifiedTalent, getAllTalents, referTalentToEvent, createReferralInvite } from '@/lib/api';
import { Event, Application, TalentProfile } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { MapPin, Clock, Users, Shirt, FileText, ArrowLeft, Send, CheckCircle, UserPlus, Search, CalendarX, Copy, Check, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useProfileCompletion } from '@/components/shared/ProfileCompletionGate';

export default function JobDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { isComplete: isProfileComplete, isChecking: isCheckingProfile } = useProfileCompletion();
    const [event, setEvent] = useState<Event | null>(null);
    const [existingApp, setExistingApp] = useState<Application | null>(null);
    const [myProfile, setMyProfile] = useState<TalentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');

    // Referral state
    const [referralLoading, setReferralLoading] = useState(false);
    const [referralModal, setReferralModal] = useState(false);
    const [allTalents, setAllTalents] = useState<TalentProfile[]>([]);
    const [referralSearch, setReferralSearch] = useState('');
    const [referringId, setReferringId] = useState<string | null>(null);
    const [referralSuccess, setReferralSuccess] = useState('');
    const [referralError, setReferralError] = useState('');
    const [copied, setCopied] = useState(false);
    const [inviteLink, setInviteLink] = useState('');

    const handleCopyLink = async () => {
        if (!inviteLink) return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            toast.success({ en: 'Invite link copied.', ar: 'تم نسخ رابط الدعوة.', 'ar-eg': 'لينك الدعوة اتنسخ.' });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error({ en: 'Could not copy the link. Copy it from the field below.', ar: 'تعذر نسخ الرابط. انسخه من الحقل أدناه.' });
        }
    };

    useEffect(() => {
        if (!params.id || !user) return;
        Promise.all([
            getEvent(params.id as string),
            getTalentProfileByUserId(user._id),
        ]).then(async ([e, p]) => {
            setEvent(e);
            setMyProfile(p);
            if (p) {
                const apps = await getTalentApplications(p._id);
                const found = apps.find((a) => a.eventId === params.id);
                if (found) setExistingApp(found);
            }
        }).catch((err) => setApplyError(err instanceof Error ? err.message : 'Could not load event.'))
            .finally(() => setLoading(false));
    }, [params.id, user]);

    const handleApply = async () => {
        if (!user || !event || !myProfile || !isProfileComplete) return;
        setApplying(true);
        setApplyError('');
        try {
            const app = await applyToEvent(event._id, myProfile._id);
            setExistingApp({ ...app, event } as Application & { event: Event });
        } catch (err) {
            setApplyError(err instanceof Error ? err.message : 'Could not apply to this event.');
        } finally {
            setApplying(false);
        }
    };

    const [responding, setResponding] = useState<'accept' | 'decline' | null>(null);
    const isPendingInvitation = Boolean(existingApp?.isDirect && existingApp.status === 'pending');

    const handleRespond = async (decision: 'accept' | 'decline') => {
        if (!existingApp || !isProfileComplete) return;
        setResponding(decision);
        setApplyError('');
        try {
            const updated = decision === 'accept'
                ? await acceptBookingInvitation(existingApp._id)
                : await declineBookingInvitation(existingApp._id);
            setExistingApp({ ...existingApp, ...updated });
        } catch (err) {
            setApplyError(err instanceof Error ? err.message : 'Could not answer this booking invitation.');
        } finally {
            setResponding(null);
        }
    };

    const canRefer = isProfileComplete && myProfile && isVerifiedTalent(myProfile) && existingApp?.status === 'accepted';

    const openReferralModal = async () => {
        setReferralSearch('');
        setReferralSuccess('');
        setReferralError('');
        setReferralModal(true);
        if (!event) return;
        setReferralLoading(true);
        setAllTalents([]);
        setInviteLink('');
        try {
            const [talents, token] = await Promise.all([getAllTalents(), createReferralInvite(event._id)]);
            setAllTalents(talents.filter((t) => t._id !== myProfile?._id));
            setInviteLink(`${window.location.origin}/register?invite=${encodeURIComponent(token)}`);
        } catch (err) {
            setReferralError(err instanceof Error ? err.message : 'Could not create an invite link');
        } finally {
            setReferralLoading(false);
        }
    };

    const handleRefer = async (talentId: string) => {
        if (!event || !myProfile) return;
        setReferringId(talentId);
        setReferralError('');
        try {
            await referTalentToEvent(event._id, myProfile._id, talentId);
            const referred = allTalents.find((t) => t._id === talentId);
            setReferralSuccess(`Referral sent to ${referred?.fullName || 'talent'}! They\'ll need to accept before it goes to the provider.`);
        } catch (err) {
            setReferralError(err instanceof Error ? err.message : 'Referral failed');
        } finally {
            setReferringId(null);
        }
    };

    const filteredTalents = referralSearch
        ? allTalents.filter((t) =>
            t.fullName.toLowerCase().includes(referralSearch.toLowerCase()) ||
            t.city.toLowerCase().includes(referralSearch.toLowerCase())
        )
        : allTalents;

    if (loading) {
        return <ContentSkeleton variant="detail" />;
    }

    if (!event) {
        return (
            <div className="text-center py-20">
                <p className="text-dark-400">Event not found</p>
                <Link href="/talent/jobs" className="text-primary-400 text-sm mt-2 inline-block">← Back to jobs</Link>
            </div>
        );
    }

    const statusBadgeVariant = existingApp
        ? existingApp.status === 'accepted' ? 'success' : existingApp.status === 'rejected' ? 'danger' : 'warning'
        : 'default';

    const isDeadlinePassed = new Date() > new Date(event.applicationDeadline);
    const isEventClosed = event.status !== 'open';
    const canApply = !isDeadlinePassed && !isEventClosed;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {event.hasMapAssignment && <Link href={`/talent/events/${event._id}/map`} className="inline-flex items-center gap-2 rounded-xl border border-primary-500/40 bg-primary-500/10 px-4 py-3 text-sm font-semibold text-primary-400 hover:bg-primary-500/20 focus-visible:outline-2 focus-visible:outline-primary-400"><MapPin size={17} /> View my map location</Link>}
            {applyError && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{applyError}</p>}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors cursor-pointer">
                <ArrowLeft size={16} /> Back to jobs
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
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="primary">{event.category}</Badge>
                        <Badge variant={event.status === 'open' ? 'success' : 'default'}>{event.status}</Badge>
                    </div>
                    <h1 className="text-xl font-bold text-dark-50">{event.title}</h1>
                </div>
            </Card>

            {/* Details */}
            <Card>
                <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">Event Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><MapPin size={16} /></div>
                        <div>
                            <p className="text-xs text-dark-500">Location</p>
                            <p className="text-sm text-dark-100">{event.location}</p>
                        </div>
                    </div>
                    {event.gatheringLocation && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><MapPin size={16} /></div>
                            <div>
                                <p className="text-xs text-dark-500">Gathering Location</p>
                                <p className="text-sm text-dark-100">{event.gatheringLocation}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><Clock size={16} /></div>
                        <div>
                            <p className="text-xs text-dark-500">Date & Time</p>
                            <p className="text-sm text-dark-100">{formatDate(event.eventDate)}</p>
                            <p className="text-xs text-dark-400">{event.startTime} - {event.endTime}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><Users size={16} /></div>
                        <div>
                            <p className="text-xs text-dark-500">Positions</p>
                            <p className="text-sm text-dark-100">{event.hiredTalents.length} / {event.requiredCount} filled</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isDeadlinePassed ? 'bg-danger-500/10 text-danger-400' : 'bg-primary-500/10 text-primary-400'}`}><CalendarX size={16} /></div>
                        <div>
                            <p className="text-xs text-dark-500">Application Deadline</p>
                            <p className={`text-sm ${isDeadlinePassed ? 'text-danger-400 font-medium' : 'text-dark-100'}`}>
                                {formatDate(event.applicationDeadline)} {isDeadlinePassed && '(Expired)'}
                            </p>
                        </div>
                    </div>
                    {event.specifyGenders ? (
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><Users size={16} /></div>
                            <div>
                                <p className="text-xs text-dark-500">Gender Breakdown</p>
                                <p className="text-sm text-dark-100 font-medium">
                                    {event.malesCount} Male{event.malesCount !== 1 ? 's' : ''} · {event.femalesCount} Female{event.femalesCount !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    ) : (
                        event.genderPreference !== 'any' && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400"><Users size={16} /></div>
                                <div>
                                    <p className="text-xs text-dark-500">Gender Preference</p>
                                    <p className="text-sm text-dark-100 capitalize">{event.genderPreference}</p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </Card>

            {/* Additional Info */}
            {(event.dressCode || event.notes) && (
                <Card>
                    {event.dressCode && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Shirt size={14} className="text-dark-400" />
                                <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Dress Code</p>
                            </div>
                            <p className="text-sm text-dark-200">{event.dressCode}</p>
                        </div>
                    )}
                    {event.notes && (
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <FileText size={14} className="text-dark-400" />
                                <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Notes</p>
                            </div>
                            <p className="text-sm text-dark-200">{event.notes}</p>
                        </div>
                    )}
                </Card>
            )}

            {/* Apply / Status Section */}
            <Card className="sticky bottom-6">
                {existingApp ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} className={existingApp.status === 'accepted' ? 'text-success-400' : existingApp.status === 'rejected' ? 'text-danger-400' : 'text-warning-400'} />
                                <div>
                                    <p className="text-sm font-medium text-dark-100">
                                        {isPendingInvitation ? 'Booking invitation' : `${existingApp.isDirect ? 'Booking' : 'Application'} ${existingApp.status}`}
                                    </p>
                                    <p className="text-xs text-dark-500">{existingApp.isDirect ? 'Invited' : 'Applied'} {formatDate(existingApp.appliedAt)}</p>
                                </div>
                            </div>
                            <Badge variant={statusBadgeVariant}>{existingApp.status}</Badge>
                        </div>

                        {isPendingInvitation && (
                            <div className="pt-3 border-t border-dark-700/50 space-y-3">
                                <p className="text-xs text-dark-300">
                                    The organization invited you to work at this event. You are only booked after you accept.
                                </p>
                                <div className="flex gap-2">
                                    <Button className="flex-1" variant="success" onClick={() => handleRespond('accept')} isLoading={responding === 'accept'}
                                        disabled={Boolean(responding) || isCheckingProfile || !isProfileComplete} icon={<Check size={16} />}>
                                        {isProfileComplete ? 'Accept booking' : 'Complete profile to accept'}
                                    </Button>
                                    <Button className="flex-1" variant="secondary" onClick={() => handleRespond('decline')} isLoading={responding === 'decline'}
                                        disabled={Boolean(responding) || isCheckingProfile || !isProfileComplete}>
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* WhatsApp Group Link — visible only to accepted ushers */}
                        {existingApp.status === 'accepted' && event.whatsappGroupLink && (
                            <div className="mt-3 pt-3 border-t border-dark-700/50 flex flex-col gap-2">
                                <p className="text-xs font-semibold text-emerald-555 uppercase tracking-wider flex items-center gap-1.5">
                                    <MessageCircle size={14} className="text-emerald-555" /> WhatsApp Group Chat
                                </p>
                                <p className="text-xs text-dark-300">
                                    You have been accepted to this event! Click below to join the WhatsApp group chat.
                                </p>
                                <a
                                    href={event.whatsappGroupLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-colors"
                                >
                                    Join WhatsApp Group
                                </a>
                            </div>
                        )}

                        {/* Refer a Friend — only for verified & accepted talents */}
                        {canRefer && (
                            <div className="pt-3 border-t border-dark-700/50">
                                <Button onClick={openReferralModal} variant="secondary" icon={<UserPlus size={16} />} className="w-full">
                                    Refer a Friend
                                </Button>
                            </div>
                        )}
                    </div>
                ) : canApply ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-dark-100">Interested in this opportunity?</p>
                            <p className="text-xs text-dark-500">Apply before {formatDate(event.applicationDeadline)}</p>
                        </div>
                        <Button onClick={handleApply} isLoading={applying} disabled={isCheckingProfile || !isProfileComplete} icon={<Send size={16} />}>
                            {isProfileComplete ? 'Apply Now' : 'Complete Profile to Apply'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <CalendarX size={20} className="text-dark-500" />
                        <div>
                            <p className="text-sm font-medium text-dark-400">Applications closed</p>
                            <p className="text-xs text-dark-500">{isDeadlinePassed ? 'The application deadline has passed' : 'This event is no longer accepting applications'}</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Referral Modal */}
            <Modal isOpen={referralModal} onClose={() => setReferralModal(false)} title="Refer a Friend">
                {referralLoading ? <ContentSkeleton variant="list" /> : <div className="space-y-4">
                    <p className="text-sm text-dark-300">Select a talent to refer. They&apos;ll need to accept the referral before it becomes an application.</p>

                    {referralSuccess && (
                        <div className="p-3 rounded-xl bg-success-500/10 border border-success-500/20 text-success-400 text-sm">
                            ✅ {referralSuccess}
                        </div>
                    )}
                    {referralError && (
                        <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                            {referralError}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                        <input
                            type="text"
                            placeholder="Search by name or city..."
                            value={referralSearch}
                            onChange={(e) => setReferralSearch(e.target.value)}
                            className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                        />
                    </div>

                    {/* Talent List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredTalents.map((talent) => (
                            <div key={talent._id} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/30 hover:bg-dark-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Avatar src={talent.photo} name={talent.fullName} size="sm" />
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-dark-100">{talent.fullName}</p>
                                            {isVerifiedTalent(talent) && <span className="text-[10px] text-success-400">✅</span>}
                                        </div>
                                        <p className="text-xs text-dark-400">{talent.city} · {talent.experienceYears}yr exp</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleRefer(talent._id)}
                                    isLoading={referringId === talent._id}
                                    disabled={!!referringId}
                                >
                                    Refer
                                </Button>
                            </div>
                        ))}
                        {filteredTalents.length === 0 && (
                            <p className="text-sm text-dark-500 text-center py-4">No talents found</p>
                        )}
                    </div>

                    {/* Invite unregistered friend */}
                    <div className="border-t border-dark-700/50 pt-4 mt-2 space-y-3">
                        <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
                            <UserPlus size={14} className="text-primary-400" />
                            Invite an Unregistered Friend
                        </h4>
                        <p className="text-xs text-dark-400">
                            Is your friend not registered yet? Share this invite link with them. Once they sign up, they will be automatically referred to this event.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={inviteLink}
                                className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-dark-300 focus:outline-none select-all"
                            />
                            <Button
                                size="sm"
                                variant={copied ? "success" : "secondary"}
                                onClick={handleCopyLink}
                                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                                className="shrink-0 font-medium min-w-[100px]"
                            >
                                {copied ? "Copied!" : "Copy Link"}
                            </Button>
                        </div>
                    </div>
                </div>}
            </Modal>
        </div>
    );
}
