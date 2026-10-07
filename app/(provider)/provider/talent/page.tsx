'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { searchTalents, getFavoriteTalents, addFavoriteTalent, removeFavoriteTalent, getProviderProfileByUserId, getProviderEvents, directBookTalent, isVerifiedTalent } from '@/lib/api';
import { TalentProfile, Event, TalentSearchFilters } from '@/types';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { EVENT_CATEGORIES, CITIES, formatEventDates } from '@/lib/utils';
import { Search, MapPin, Star, Shield, Clock, UserPlus, Briefcase, Heart } from 'lucide-react';
import Link from 'next/link';
import { useProfileCompletion } from '@/components/shared/ProfileCompletionGate';

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
        <div className="space-y-6 animate-fade-in">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <div>
                <h1 className="display text-3xl sm:text-4xl">Search Talent</h1>
                <p className="text-dark-400 mt-1">Find and book the perfect talent for your events</p>
                <button type="button" onClick={() => setFavoritesOnly((value) => !value)}
                    aria-pressed={favoritesOnly}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dark-700 px-3 py-2 text-sm text-dark-200 hover:border-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">
                    <Heart size={15} fill={favoritesOnly ? 'currentColor' : 'none'} />
                    {favoritesOnly ? 'Show all talent' : 'Favorites (' + favorites.length + ')'}
                </button>
            </div>

            {/* Filters */}
            <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-dark-300">City</label>
                        <select
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-dark-900 text-dark-100">All cities</option>
                            {CITIES.map((c) => <option key={c} value={c} className="bg-dark-900 text-dark-100">{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-dark-300">Category</label>
                        <select
                            value={searchCategory}
                            onChange={(e) => setSearchCategory(e.target.value)}
                            className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-dark-900 text-dark-100">All categories</option>
                            {EVENT_CATEGORIES.map((c) => <option key={c} value={c} className="bg-dark-900 text-dark-100">{c}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Results */}
            {loading && !favoritesOnly ? (
                <ContentSkeleton variant="cards" />
            ) : shownTalents.length === 0 ? (
                <Card className="text-center py-12">
                    <Search size={32} className="mx-auto text-dark-600 mb-3" />
                    <p className="text-dark-400">{favoritesOnly ? 'No favorite ushers yet' : 'No talent found matching your criteria'}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shownTalents.map((talent) => (
                        <Card key={talent._id} className="flex flex-col">
                            <div className="flex items-center gap-3 mb-4">
                                <button type="button" onClick={() => toggleFavorite(talent)}
                                    disabled={favoriteBusy === talent._id}
                                    aria-label={favorites.some((item) => item._id === talent._id) ? 'Remove ' + talent.fullName + ' from favorites' : 'Add ' + talent.fullName + ' to favorites'}
                                    aria-pressed={favorites.some((item) => item._id === talent._id)}
                                    className="rounded-lg p-2 text-primary-400 hover:bg-dark-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 disabled:opacity-50">
                                    <Heart size={18} fill={favorites.some((item) => item._id === talent._id) ? 'currentColor' : 'none'} />
                                </button>
                                <Avatar src={talent.photo} name={talent.fullName} size="lg" />
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Link href={`/provider/talent/${talent._id}`} className="text-sm font-semibold text-dark-100 hover:text-primary-500 transition-colors">{talent.fullName}</Link>
                                        {isVerifiedTalent(talent) && <span className="text-xs text-success-400">✅</span>}
                                    </div>
                                    <p className="text-xs text-dark-400 flex items-center gap-1"><MapPin size={11} /> {talent.city}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <Badge variant="primary"><Shield size={10} className="inline mr-1" />{talent.reliabilityScore}%</Badge>
                                <Badge variant="warning"><Star size={10} className="inline mr-1" />{talent.ratingAverage}</Badge>
                                <Badge variant="default"><Clock size={10} className="inline mr-1" />{talent.experienceYears}yr</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {talent.categories.map((cat) => (
                                    <span key={cat} className="text-[10px] px-2 py-0.5 rounded-md bg-dark-800 text-dark-400 border border-dark-700">{cat}</span>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">
                                {talent.languages.map((lang) => (
                                    <span key={lang} className="text-[10px] px-2 py-0.5 rounded-md bg-dark-800/50 text-dark-500">{lang}</span>
                                ))}
                            </div>
                            <div className="mt-auto pt-3 border-t border-dark-700/50">
                                <Button size="sm" icon={<UserPlus size={14} />} disabled={isCheckingProfile || !isProfileComplete} onClick={() => openBookingModal(talent)} className="w-full">
                                    {isProfileComplete ? 'Direct Book' : 'Complete Profile'}
                                </Button>
                            </div>
                        </Card>
                    ))}
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
