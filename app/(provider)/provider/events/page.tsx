'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getProviderProfileByUserId, getProviderEvents } from '@/lib/api';
import { Event, EventStatus } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatEventDates } from '@/lib/utils';
import { CalendarDays, MapPin, Users, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProviderEventsPage() {
    const { user, isOrganizer } = useAuth();
    const { t, language } = useLanguage();
    const isArabic = language === 'ar' || language === 'ar-eg';
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState<'' | EventStatus>('');

    useEffect(() => {
        if (!user) return;
        getProviderProfileByUserId(user._id).then(async (p) => {
            if (!p) return;
            const res = await getProviderEvents(p._id, tab ? { status: tab } : undefined);
            setEvents(res.data);
            setError('');
        }).catch((err) => setError(err instanceof Error ? err.message : 'Could not load events.'))
            .finally(() => setLoading(false));
    }, [user, tab]);

    const statusVariant = (s: string) =>
        s === 'open' ? 'success' as const : s === 'confirmed' ? 'primary' as const : s === 'completed' ? 'default' as const : 'danger' as const;

    const getTabLabel = (val: string) => {
        const labels: Record<string, string> = {
            '': isArabic ? 'الكل' : 'All',
            [EventStatus.OPEN]: isArabic ? 'مفتوح' : 'Open',
            [EventStatus.CONFIRMED]: isArabic ? 'مؤكد' : 'Confirmed',
            [EventStatus.COMPLETED]: isArabic ? 'مكتمل' : 'Completed',
            [EventStatus.CANCELLED]: isArabic ? 'ملغي' : 'Cancelled',
        };
        return labels[val] || val;
    };

    if (loading) {
        return <ContentSkeleton variant="list" />;
    }

    return (
        <div className="space-y-6 animate-fade-in text-start">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-dark-50">{t('nav_events')}</h1>
                    <p className="text-dark-400 mt-1 font-semibold">{isArabic ? 'إدارة ونشر عروض الفعاليات الخاصة بك' : 'Manage your event listings'}</p>
                </div>
                {isOrganizer && (
                    <Link href="/provider/events/new">
                        <Button icon={<PlusCircle size={16} />} className="font-black">
                            {isArabic ? 'فعالية جديدة' : 'New Event'}
                        </Button>
                    </Link>
                )}
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                    { value: '', label: 'All' },
                    { value: EventStatus.OPEN, label: 'Open' },
                    { value: EventStatus.CONFIRMED, label: 'Confirmed' },
                    { value: EventStatus.COMPLETED, label: 'Completed' },
                    { value: EventStatus.CANCELLED, label: 'Cancelled' },
                ].map((tItem) => (
                    <button
                        key={tItem.value}
                        onClick={() => { setTab(tItem.value as '' | EventStatus); setLoading(true); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer whitespace-nowrap ${
                          tab === tItem.value 
                            ? 'bg-primary-500 text-on-primary border-primary-500' 
                            : 'bg-dark-900 text-dark-200 border-dark-50 hover:bg-dark-800'
                        }`}
                    >
                        {getTabLabel(tItem.value)}
                    </button>
                ))}
            </div>

            {events.length === 0 ? (
                <Card className="text-center py-12">
                    <CalendarDays size={32} className="mx-auto text-dark-600 mb-3" />
                    <p className="text-dark-450 font-bold">{isArabic ? 'لم يتم العثور على فعاليات' : 'No events found'}</p>
                    {isOrganizer && (
                        <Link href="/provider/events/new" className="text-xs text-primary-555 hover:text-primary-450 mt-2 inline-block font-bold">
                            {t('create_first_event')}
                        </Link>
                    )}
                </Card>
            ) : (
                <div className="space-y-3">
                    {events.map((event) => (
                        <Link key={event._id} href={`/provider/events/${event._id}`}>
                            <Card hover className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <Badge variant="primary">{event.category}</Badge>
                                        <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                                    </div>
                                    <h3 className="text-sm font-bold text-dark-100">{event.title}</h3>
                                    <div className="flex items-center gap-4 mt-1.5 font-semibold">
                                        <span className="text-xs text-dark-400 flex items-center gap-1"><MapPin size={12} className="text-primary-500" /> {event.location}</span>
                                        <span className="text-xs text-dark-400 flex items-center gap-1"><CalendarDays size={12} className="text-dark-300" /> {formatEventDates(event)}</span>
                                        <span className="text-xs text-dark-400 flex items-center gap-1"><Users size={12} className="text-success-500" /> {event.hiredTalents.length}/{event.requiredCount}</span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
