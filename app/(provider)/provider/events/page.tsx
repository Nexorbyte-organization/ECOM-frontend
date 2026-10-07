'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getProviderProfileByUserId, getProviderEvents } from '@/lib/api';
import { Event, EventStatus } from '@/types';
import Tabs from '@/components/ui/Tabs';
import EventRow from '@/components/events/EventRow';
import { RowList } from '@/components/ui/Ticket';
import Badge from '@/components/ui/Badge';
import { PlusCircle } from 'lucide-react';
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

    const emptyCopy = isArabic ? 'مفيش إيفينتس هنا' : 'No events here yet';

    return (
        <div className="space-y-8 text-start">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="display text-3xl sm:text-4xl">{t('nav_events')}</h1>
                    <p className="mt-2 text-dark-300">{isArabic ? 'إدارة ونشر عروض الفعاليات الخاصة بك' : 'Manage your event listings'}</p>
                </div>
                {isOrganizer && (
                    <Link href="/provider/events/new" className="press hidden min-h-12 items-center gap-2 rounded-xl bg-primary-500 px-6 font-bold text-on-primary md:inline-flex">
                        <PlusCircle size={18} />{isArabic ? 'فعالية جديدة' : 'New Event'}
                    </Link>
                )}
            </header>

            <Tabs label={t('nav_events')} value={tab} onChange={(value) => { setTab(value); setLoading(true); }}
                items={[EventStatus.OPEN, EventStatus.CONFIRMED, EventStatus.COMPLETED, EventStatus.CANCELLED].reduce<{ value: '' | EventStatus; label: string }[]>(
                    (list, value) => [...list, { value, label: getTabLabel(value) }], [{ value: '', label: getTabLabel('') }])} />

            {loading ? (
                <ContentSkeleton variant="list" />
            ) : events.length === 0 ? (
                <section className="rounded-2xl border border-dashed border-dark-500 p-10 text-center sm:p-14">
                    <p className="display text-4xl">{emptyCopy}</p>
                    {isOrganizer && (
                        <Link href="/provider/events/new" className="press mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary-500 px-7 font-bold text-on-primary">
                            {t('create_first_event')}
                        </Link>
                    )}
                </section>
            ) : (
                <RowList>
                    {events.map((event) => (
                        <EventRow key={event._id} event={event} href={`/provider/events/${event._id}`}
                            aside={<Badge variant={statusVariant(event.status)}>{getTabLabel(event.status)}</Badge>} />
                    ))}
                </RowList>
            )}
        </div>
    );
}
