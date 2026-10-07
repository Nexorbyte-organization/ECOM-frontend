'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { getOpenEvents } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { Event, EventFilters } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { EVENT_CATEGORIES, formatEventDates, formatEventHours } from '@/lib/utils';
import { MapPin, Clock, Users, Search, Filter } from 'lucide-react';
import Link from 'next/link';

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
        <div className="space-y-6 animate-fade-in text-start">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <div>
                <h1 className="text-2xl font-black text-dark-50">{t('browse_jobs_title')}</h1>
                <p className="text-dark-400 mt-1 font-semibold">{t('browse_jobs_desc')}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      type="text"
                      placeholder={t('search_placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl ps-10 pe-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setCategoryFilter('')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all cursor-pointer ${
                          !categoryFilter 
                            ? 'bg-primary-500 text-white border-dark-50 shadow-[2px_2px_0_0_var(--color-dark-50)]' 
                            : 'bg-dark-900 text-dark-200 border-dark-50 hover:bg-dark-800'
                        }`}
                    >
                        {t('all_categories')}
                    </button>
                    {EVENT_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all cursor-pointer ${
                              categoryFilter === cat 
                                ? 'bg-primary-500 text-white border-dark-50 shadow-[2px_2px_0_0_var(--color-dark-50)]' 
                                : 'bg-dark-900 text-dark-200 border-dark-50 hover:bg-dark-800'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Job List */}
            {loading ? (
                <ContentSkeleton variant="cards" />
            ) : filteredEvents.length === 0 ? (
                <Card className="text-center py-12">
                    <Filter size={32} className="mx-auto text-dark-600 mb-3" />
                    <p className="text-dark-450 font-bold">{t('no_jobs_matching')}</p>
                    <p className="text-xs text-dark-500 mt-1 font-semibold">{t('adjust_filters')}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                    {filteredEvents.map((event) => (
                        <Link key={event._id} href={`/talent/jobs/${event._id}`}>
                            <Card hover className="h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge variant="primary">{event.category}</Badge>
                                        <Badge variant="default">{event.hiredTalents.length}/{event.requiredCount} {t('spots')}</Badge>
                                    </div>
                                    <h3 className="text-base font-black text-dark-50 mb-2">{event.title}</h3>
                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-dark-400 font-semibold">
                                            <MapPin size={13} className="text-primary-500" />
                                            <span>{event.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-dark-400 font-semibold">
                                            <Clock size={13} className="text-blue-500" />
                                            <span>{formatEventDates(event)} · {formatEventHours(event)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-dark-400 font-semibold">
                                            <Users size={13} className="text-success-500" />
                                            <span>{event.hiredTalents.length}/{event.requiredCount} {t('positions_filled')}</span>
                                        </div>
                                    </div>
                                </div>
                                {event.dressCode && (
                                    <p className="text-xs text-dark-500 truncate font-semibold pt-2.5 border-t border-dark-900">
                                        👔 {t('dress_code')}: {event.dressCode}
                                    </p>
                                )}
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
