'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { searchTalents, getFavoriteTalents, addFavoriteTalent, removeFavoriteTalent, getProviderProfileByUserId, getProviderEvents, directBookTalent, isVerifiedTalent } from '@/lib/api';
import { TalentProfile, Event, TalentSearchFilters } from '@/types';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { EVENT_CATEGORIES, CITIES, formatEventDates } from '@/lib/utils';
import { Search, MapPin, Star, Shield, UserPlus, Briefcase, Heart, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useProfileCompletion } from '@/components/shared/ProfileCompletionGate';

const INITIAL_TINTS = ['bg-cat-coral/15 text-cat-coral-ink', 'bg-cat-sky/15 text-cat-sky-ink', 'bg-cat-teal/15 text-cat-teal-ink', 'bg-cat-rose/15 text-cat-rose-ink', 'bg-cat-sun/20 text-cat-sun-ink', 'bg-cat-lime/20 text-cat-lime-ink'];

/** The usher's photo fills the card. With no photo (or a broken link) it falls back to big initials on a soft tint. */
function TalentPhoto({ talent }: { talent: TalentProfile }) {
    const [failed, setFailed] = useState(false);
    const tint = INITIAL_TINTS[(talent.fullName.charCodeAt(0) || 0) % INITIAL_TINTS.length];
    const initials = talent.fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    if (talent.photo && !failed) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={talent.photo} alt={talent.fullName} onError={() => setFailed(true)} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />;
    }
    return <div className={`grid size-full place-items-center ${tint}`} role="img" aria-label={talent.fullName}><span className="display text-6xl">{initials}</span></div>;
}

export default function TalentSearchPage() {
    const { user } = useAuth();
    const { isComplete: isProfileComplete, isChecking: isCheckingProfile } = useProfileCompletion();
    const [talents, setTalents] = useState<TalentProfile[]>([]);
    const [favorites, setFavorites] = useState<TalentProfile[]>([]);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [favoriteBusy, setFavoriteBusy] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchCity, setSearchCity] = useState('');
    const [searchCategory, setSearchCategory] = useState('');

    // Direct booking state
    const [bookingModal, setBookingModal] = useState<{ open: boolean; talent: TalentProfile | null }>({ open: false, talent: null });
    const [providerEvents, setProviderEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [bookingOptionsLoading, setBookingOptionsLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [inviteAsStandby, setInviteAsStandby] = useState(false);
    const [error, setError] = useState('');

    const fetchTalents = async () => {
        setLoading(true);
        setError('');
        try {
            const filters: TalentSearchFilters = {};
            if (searchCity) filters.city = searchCity;
            if (searchCategory) filters.category = searchCategory;
            const res = await searchTalents(filters);
            setTalents(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load talent.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getFavoriteTalents().then(setFavorites).catch((err) => {
            setError(err instanceof Error ? err.message : 'Could not load favorites.');
        });
    }, []);

    const toggleFavorite = async (talent: TalentProfile) => {
        const saved = favorites.some((item) => item._id === talent._id);
        setFavoriteBusy(talent._id);
        try {
            if (saved) {
                await removeFavoriteTalent(talent._id);
                setFavorites((items) => items.filter((item) => item._id !== talent._id));
            } else {
                await addFavoriteTalent(talent._id);
                setFavorites((items) => [...items, talent]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not update favorites.');
        } finally {
            setFavoriteBusy(null);
        }
    };

    const shownTalents = favoritesOnly ? favorites : talents;
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const bookableEvents = providerEvents.filter((event) => (inviteAsStandby
        ? Boolean(event.standbyCount) && new Date(event.eventDate) >= todayStart
        : event.status === 'open'));

    // Search results follow the two server-side filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchTalents(); }, [searchCity, searchCategory]);

    const openBookingModal = async (talent: TalentProfile) => {
        if (!user || !isProfileComplete) return;
        setError('');
        setBookingOptionsLoading(true);
        setBookingSuccess(false);
        setProviderEvents([]);
        setSelectedEventId('');
        setInviteAsStandby(false);
        setBookingModal({ open: true, talent });
        try {
            const profile = await getProviderProfileByUserId(user._id);
            if (!profile) return;
            const events = await getProviderEvents(profile._id);
            // Standby invitations also work after hiring closes, until the event starts.
            setProviderEvents(events.data.filter((e) => e.status === 'open' || e.status === 'confirmed'));
            setBookingModal({ open: true, talent });
            setSelectedEventId('');
            setBookingSuccess(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load events for booking.');
        } finally {
            setBookingOptionsLoading(false);
        }
    };

    const handleDirectBook = async () => {
        if (!bookingModal.talent || !selectedEventId) return;
        setBookingLoading(true);
        setError('');
        try {
            await directBookTalent(selectedEventId, bookingModal.talent._id, inviteAsStandby);
            setBookingSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send booking request.');
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="display text-3xl sm:text-4xl">Search Talent</h1>
                    <p className="mt-1 text-dark-300">Find and book the perfect talent for your events</p>
                </div>
                <button type="button" onClick={() => setFavoritesOnly((value) => !value)}
                    aria-pressed={favoritesOnly}
                    className={`press inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold ${favoritesOnly ? 'border-primary-500 bg-primary-50 text-primary-600 dark:text-primary-400' : 'border-dark-500 text-dark-100 hover:bg-dark-850'}`}>
                    <Heart size={16} fill={favoritesOnly ? 'currentColor' : 'none'} />
                    {favoritesOnly ? 'Show all talent' : 'Favorites (' + favorites.length + ')'}
                </button>
            </header>

            {/* Filters: two plain selects, no box around them */}
            <div className="grid max-w-xl grid-cols-2 gap-3">
                <Select label="City" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="All cities"
                    options={CITIES.map((c) => ({ value: c, label: c }))} />
                <Select label="Category" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} placeholder="All categories"
                    options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </div>

            {/* Results: the photo is the card */}
            {loading && !favoritesOnly ? (
                <ContentSkeleton variant="cards" />
            ) : shownTalents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-dark-500 p-12 text-center">
                    <Search size={28} className="mx-auto mb-3 text-dark-400" />
                    <p className="display-sm text-xl">{favoritesOnly ? 'No favorite ushers yet' : 'No talent found'}</p>
                    {!favoritesOnly && <p className="mt-1 text-sm text-dark-300">Try another city or category.</p>}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
                    {shownTalents.map((talent) => {
                        const saved = favorites.some((item) => item._id === talent._id);
                        return (
                            <article key={talent._id} className="group min-w-0">
                                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-dark-800">
                                    <Link href={`/provider/talent/${talent._id}`} className="absolute inset-0" aria-label={`Open ${talent.fullName}'s profile`}>
                                        <TalentPhoto talent={talent} />
                                    </Link>
                                    <button type="button" onClick={() => toggleFavorite(talent)}
                                        disabled={favoriteBusy === talent._id}
                                        aria-label={saved ? 'Remove ' + talent.fullName + ' from favorites' : 'Add ' + talent.fullName + ' to favorites'}
                                        aria-pressed={saved}
                                        className={`press absolute end-3 top-3 grid size-10 place-items-center rounded-full bg-white shadow-md disabled:opacity-50 ${saved ? 'text-danger-500' : 'text-ink'}`}>
                                        <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
                                    </button>
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-3.5 pt-12 text-white">
                                        <p className="flex items-center gap-1.5 text-base font-semibold leading-tight">
                                            <span className="truncate">{talent.fullName}</span>
                                            {isVerifiedTalent(talent) && <BadgeCheck size={16} className="shrink-0 text-accent-400" aria-label="Verified" />}
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80"><MapPin size={12} aria-hidden="true" />{talent.city}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                                    <p className="flex items-center gap-3 text-sm font-medium text-dark-200">
                                        <span className="inline-flex items-center gap-1"><Star size={14} className="text-cat-sun" fill="currentColor" aria-hidden="true" />{talent.ratingAverage}</span>
                                        <span className="inline-flex items-center gap-1"><Shield size={14} className="text-primary-500" aria-hidden="true" />{talent.reliabilityScore}%</span>
                                    </p>
                                    <Button size="sm" variant="secondary" icon={<UserPlus size={14} />} disabled={isCheckingProfile || !isProfileComplete} onClick={() => openBookingModal(talent)} className="w-full lg:w-auto">
                                        {isProfileComplete ? 'Book' : 'Complete profile'}
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Direct Booking Modal */}
            <Modal
                isOpen={bookingModal.open}
                onClose={() => setBookingModal({ open: false, talent: null })}
                title={`Book ${bookingModal.talent?.fullName}`}
            >
                {error && <p role="alert" className="mb-4 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
                {bookingOptionsLoading ? <ContentSkeleton variant="form" count={2} /> : bookingSuccess ? (
                    <div className="text-center py-4">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success-500/15 flex items-center justify-center">
                            <Briefcase size={20} className="text-success-400" />
                        </div>
                        <p className="text-sm font-semibold text-dark-100">{inviteAsStandby ? 'Standby invitation sent!' : 'Booking request sent!'}</p>
                        <p className="text-xs text-dark-400 mt-1">Waiting for talent to accept</p>
                        <Button className="mt-4" variant="secondary" onClick={() => setBookingModal({ open: false, talent: null })}>
                            Close
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <label className="flex items-start gap-2 text-sm text-dark-200 cursor-pointer">
                            <input type="checkbox" checked={inviteAsStandby} className="mt-1 h-4 w-4 accent-primary-500"
                                onChange={(e) => { setInviteAsStandby(e.target.checked); setSelectedEventId(''); }} />
                            <span>
                                Invite to the standby list
                                <span className="block text-xs text-dark-400">Unpaid and on call. They&apos;re moved in automatically if a hired usher drops out before the start.</span>
                            </span>
                        </label>
                        <p className="text-sm text-dark-300">Select an event to {inviteAsStandby ? 'invite this talent to as standby' : 'book this talent for'}:</p>
                        {bookableEvents.length === 0 ? (
                            <p className="text-sm text-dark-500">{inviteAsStandby ? 'No upcoming events have standby spots. Set a standby count on an event first.' : 'No open events available. Create an event first.'}</p>
                        ) : (
                            <div className="space-y-2">
                                {bookableEvents.map((event) => (
                                    <button
                                        key={event._id}
                                        onClick={() => setSelectedEventId(event._id)}
                                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedEventId === event._id
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-dark-700 bg-dark-800/30 hover:border-dark-600'
                                            }`}
                                    >
                                        <p className="text-sm font-medium text-dark-100">{event.title}</p>
                                        <p className="text-xs text-dark-400">{formatEventDates(event)} · {event.location}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        <Button onClick={handleDirectBook} isLoading={bookingLoading} disabled={!selectedEventId || !isProfileComplete} className="w-full">
                            {inviteAsStandby ? 'Send Standby Invitation' : 'Send Booking Request'}
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
