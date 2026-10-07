'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { getOpenEvents } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { Event, EventFilters } from '@/types';
import GigTicket from '@/components/events/GigTicket';
import { toneBg, toneFor } from '@/lib/ticket';
import { EVENT_CATEGORIES } from '@/lib/utils';
import { Search, Filter } from 'lucide-react';

export default function BrowseJobsPage() {
    const { t } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchJobs = async () => {
        setLoading(true);
        setError('');
        try {
            const filters: EventFilters = {};
            if (categoryFilter) filters.category = categoryFilter;
            const res = await getOpenEvents(filters);
            setEvents(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load jobs.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch again when the server-side category filter changes.
    useEffect(() => {
        const timeout = window.setTimeout(() => { void fetchJobs(); }, 0);
        return () => window.clearTimeout(timeout);
    }, [categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const filteredEvents = searchQuery
        ? events.filter((e) =>
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : events;

    return (
        <div className="text-start">
            {error && <p role="alert" className="mb-6 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <header className="mb-8">
                <h1 className="display text-5xl sm:text-6xl">{t('browse_jobs_title')}</h1>
                <p className="mt-2 max-w-[52ch] text-dark-300">{t('browse_jobs_desc')}</p>
            </header>

            <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
                {/* Filters: a rail on desktop, a swipe row on phones */}
                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                    <div className="relative">
                        <Search size={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            aria-label={t('search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border-2 border-edge bg-dark-900 py-3 ps-11 pe-4 text-sm text-dark-50 placeholder:text-dark-400 focus:shadow-[3px_3px_0_0_var(--color-accent-400)]"
                        />
                    </div>
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
                        {[{ value: '', label: t('all_categories') }, ...EVENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))].map((cat) => {
                            const active = categoryFilter === cat.value;
                            return (
                                <button
                                    key={cat.value || 'all'}
                                    onClick={() => setCategoryFilter(cat.value)}
                                    aria-pressed={active}
                                    className={`press flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition-colors lg:border-transparent lg:py-2.5 ${active ? 'border-edge bg-accent-400 text-ticket-ink' : 'border-edge bg-dark-900 text-dark-100 lg:bg-transparent lg:hover:bg-dark-850'}`}
                                >
                                    <span aria-hidden="true" className={`size-3 rounded-full border-2 border-edge ${cat.value ? toneBg[toneFor(cat.value)] : 'bg-dark-900'}`} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* The feed */}
                <section aria-live="polite">
                    {loading ? (
                        <ContentSkeleton variant="list" />
                    ) : filteredEvents.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-dark-500 p-10 text-center">
                            <Filter size={32} className="mx-auto mb-3 text-dark-400" />
                            <p className="display-sm text-2xl">{t('no_jobs_matching')}</p>
                            <p className="mt-1 text-sm text-dark-300">{t('adjust_filters')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredEvents.map((event) => {
                                const left = Math.max(0, event.requiredCount - event.hiredTalents.length);
                                return (
                                    <GigTicket
                                        key={event._id}
                                        event={event}
                                        href={`/talent/jobs/${event._id}`}
                                        aside={<span className="display-sm text-2xl tabular-nums">{event.budget}<span className="ms-1 font-sans text-xs font-medium text-dark-300">EGP</span></span>}
                                        footer={<span className={`text-xs font-bold ${left <= 2 ? 'text-danger-500' : 'text-dark-300'}`}>{left === 0 ? t('positions_filled') : `${left} ${t('spots')}`}{event.dressCode ? `, ${event.dressCode}` : ''}</span>}
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
