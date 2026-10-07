'use client';

import { toast } from '@/lib/toast';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import {
    getAllEvents, getAllProviderProfiles,
    adminUpdateEventStatus, adminDeleteEvent,
    getPendingEventActionRequests, resolveEventActionRequest,
} from '@/lib/api';
import { Event, ProviderProfile, EventStatus, EventActionRequest } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatEventDates } from '@/lib/utils';
import { Calendar, Search, MapPin, Clock, Users, DollarSign, Trash2, XCircle, CheckCircle, Play, Ban, AlertTriangle, FileWarning } from 'lucide-react';

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [providers, setProviders] = useState<ProviderProfile[]>([]);
    const [pendingRequests, setPendingRequests] = useState<(EventActionRequest & { event: Event; provider: ProviderProfile })[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all' | 'open' | 'confirmed' | 'completed' | 'cancelled'>('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [resolveLoading, setResolveLoading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        action: string;
        eventId: string;
        eventTitle: string;
        newStatus?: EventStatus;
    }>({ open: false, action: '', eventId: '', eventTitle: '' });

    const fetchData = async () => {
        const [e, p, reqs] = await Promise.all([
            getAllEvents(),
            getAllProviderProfiles(),
            getPendingEventActionRequests(),
        ]);
        setEvents(e);
        setProviders(p);
        setPendingRequests(reqs);
        setLoading(false);
    };

    useEffect(() => {
        void fetchData().catch((err) => {
            setError(err instanceof Error ? err.message : 'Could not load events.');
            setLoading(false);
        });
    }, []);

    const handleAction = async () => {
        const { action, eventId, newStatus } = confirmModal;
        setActionLoading(eventId);
        setError('');
        setConfirmModal({ open: false, action: '', eventId: '', eventTitle: '' });
        try {
            if (action === 'delete') {
                await adminDeleteEvent(eventId);
            } else if (action === 'status' && newStatus) {
                await adminUpdateEventStatus(eventId, newStatus);
            }
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not update event.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResolveRequest = async (requestId: string, decision: 'approved' | 'rejected') => {
        setResolveLoading(requestId);
        try {
            await resolveEventActionRequest(requestId, decision);
            await fetchData();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to resolve request');
        } finally {
            setResolveLoading(null);
        }
    };

    const openStatusChange = (eventId: string, eventTitle: string, newStatus: EventStatus) => {
        setConfirmModal({ open: true, action: 'status', eventId, eventTitle, newStatus });
    };

    const openDelete = (eventId: string, eventTitle: string) => {
        setConfirmModal({ open: true, action: 'delete', eventId, eventTitle });
    };

    const filtered = events.filter(e => {
        if (tab !== 'all' && e.status !== tab) return false;
        if (search) {
            return e.title.toLowerCase().includes(search.toLowerCase()) ||
                e.location.toLowerCase().includes(search.toLowerCase());
        }
        return true;
    });

    const getProvider = (providerId: string) => providers.find(p => p._id === providerId);

    const statusVariant = (s: string) =>
        s === 'open' ? 'success' as const :
            s === 'confirmed' ? 'primary' as const :
                s === 'completed' ? 'default' as const :
                    'danger' as const;

    const statusActions = (status: string): { label: string; newStatus: EventStatus; icon: React.ReactNode; variant: 'secondary' | 'ghost' }[] => {
        const actions: { label: string; newStatus: EventStatus; icon: React.ReactNode; variant: 'secondary' | 'ghost' }[] = [];
        if (status !== 'cancelled') actions.push({ label: 'Cancel', newStatus: EventStatus.CANCELLED, icon: <XCircle size={14} />, variant: 'ghost' });
        if (status !== 'open') actions.push({ label: 'Reopen', newStatus: EventStatus.OPEN, icon: <Play size={14} />, variant: 'secondary' });
        if (status !== 'confirmed') actions.push({ label: 'Confirm', newStatus: EventStatus.CONFIRMED, icon: <CheckCircle size={14} />, variant: 'secondary' });
        if (status !== 'completed') actions.push({ label: 'Complete', newStatus: EventStatus.COMPLETED, icon: <Ban size={14} />, variant: 'secondary' });
        return actions;
    };

    if (loading) {
        return <ContentSkeleton variant="list" />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <div>
                <h1 className="text-2xl font-bold text-dark-50">Events</h1>
                <p className="text-dark-400 mt-1">Manage all platform events</p>
            </div>

            {/* Pending Provider Requests */}
            {pendingRequests.length > 0 && (
                <Card className="border-2 border-warning-500/30 bg-warning-500/5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-warning-500/20 text-warning-500">
                            <FileWarning size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-dark-100">Pending Provider Requests</h3>
                            <p className="text-xs text-dark-400">
                                {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} awaiting your decision
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {pendingRequests.map((req) => (
                            <div
                                key={req._id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-dark-950 border border-warning-500/20"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <Badge variant="danger">
                                            {req.requestType === 'cancel' ? '🚫 Cancel Request' : '🗑️ Delete Request'}
                                        </Badge>
                                        <Badge variant={statusVariant(req.event.status)}>{req.event.status}</Badge>
                                    </div>
                                    <p className="text-sm font-semibold text-dark-100 truncate">{req.event.title}</p>
                                    <p className="text-xs text-dark-400 mt-0.5">
                                        by {req.provider.companyName} · {new Date(req.createdAt).toLocaleDateString()}
                                    </p>
                                    {req.reason && (
                                        <p className="text-xs text-dark-300 mt-1 italic flex items-start gap-1">
                                            <AlertTriangle size={11} className="text-warning-500 flex-shrink-0 mt-0.5" />
                                            &quot;{req.reason}&quot;
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                        size="sm"
                                        variant="success"
                                        icon={<CheckCircle size={14} />}
                                        isLoading={resolveLoading === req._id}
                                        onClick={() => handleResolveRequest(req._id, 'approved')}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        icon={<XCircle size={14} />}
                                        isLoading={resolveLoading === req._id}
                                        onClick={() => handleResolveRequest(req._id, 'rejected')}
                                        className="text-danger-500 hover:bg-danger-50"
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search events..."
                        className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border-2 border-dark-50 rounded-xl text-sm text-dark-100 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'open', 'confirmed', 'completed', 'cancelled'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer capitalize ${tab === t ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30' : 'text-dark-400 hover:text-dark-200 border border-dark-700 hover:border-dark-600'
                                }`}
                        >
                            {t} ({events.filter(e => t === 'all' ? true : e.status === t).length})
                        </button>
                    ))}
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <Card className="text-center py-12">
                        <Calendar size={32} className="mx-auto text-dark-600 mb-3" />
                        <p className="text-dark-400">No events found</p>
                    </Card>
                ) : (
                    filtered.map((event) => {
                        const provider = getProvider(event.providerId);
                        const isActioning = actionLoading === event._id;
                        return (
                            <Card key={event._id} className={`${event.status === 'cancelled' ? 'opacity-60' : ''}`}>
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    {/* Event Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <Badge variant="primary">{event.category}</Badge>
                                            <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                                        </div>
                                        <h3 className="text-sm font-semibold text-dark-100">{event.title}</h3>
                                        {provider && (
                                            <p className="text-xs text-dark-500 mt-0.5">by {provider.companyName}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                            <span className="text-xs text-dark-400 flex items-center gap-1">
                                                <MapPin size={12} /> {event.location}
                                            </span>
                                            <span className="text-xs text-dark-400 flex items-center gap-1">
                                                <Clock size={12} /> {formatEventDates(event)}
                                            </span>
                                            <span className="text-xs text-dark-400 flex items-center gap-1">
                                                <Users size={12} /> {event.hiredTalents.length}/{event.requiredCount} hired
                                            </span>
                                            <span className="text-xs text-dark-400 flex items-center gap-1">
                                                <DollarSign size={12} /> {event.budget} EGP{(event.dayCount ?? 1) > 1 ? ' / day' : ''}
                                            </span>
                                        </div>
                                        <div className="mt-1.5">
                                            <span className="text-xs text-dark-500">Deadline: {formatDate(event.applicationDeadline)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        {statusActions(event.status).map((action) => (
                                            <Button
                                                key={action.label}
                                                variant={action.variant}
                                                size="sm"
                                                icon={action.icon}
                                                onClick={() => openStatusChange(event._id, event.title, action.newStatus)}
                                                isLoading={isActioning}
                                                className={action.label === 'Cancel' ? 'text-danger-500 hover:bg-danger-50' : ''}
                                            >
                                                {action.label}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={<Trash2 size={14} />}
                                            onClick={() => openDelete(event._id, event.title)}
                                            isLoading={isActioning}
                                            className="text-danger-500 hover:bg-danger-50"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <p className="text-xs text-dark-500 text-center">Showing {filtered.length} of {events.length} events</p>

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, action: '', eventId: '', eventTitle: '' })}
                title="Confirm Action"
            >
                <div className="space-y-4">
                    <p className="text-sm text-dark-300">
                        {confirmModal.action === 'delete' ? (
                            <>Are you sure you want to <strong className="text-danger-500">permanently delete</strong> the event <strong className="text-dark-100">{confirmModal.eventTitle}</strong>? This will also remove all related applications.</>
                        ) : (
                            <>Are you sure you want to change the status of <strong className="text-dark-100">{confirmModal.eventTitle}</strong> to <Badge variant={statusVariant(confirmModal.newStatus || '')}>{confirmModal.newStatus}</Badge>?</>
                        )}
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmModal({ open: false, action: '', eventId: '', eventTitle: '' })}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={confirmModal.action === 'delete' || confirmModal.newStatus === EventStatus.CANCELLED ? 'danger' : 'primary'}
                            onClick={handleAction}
                            className="flex-1"
                        >
                            {confirmModal.action === 'delete' ? 'Delete Event' :
                                `Set ${confirmModal.newStatus}`}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
