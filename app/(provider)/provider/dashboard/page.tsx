'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useCopy } from '@/lib/copy';
import { getProviderProfileByUserId, getProviderEvents, getAnalytics } from '@/lib/api';
import { Event, EventStatus } from '@/types';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import EventRow from '@/components/events/EventRow';
import { RowList } from '@/components/ui/Ticket';
import NextUp from '@/components/events/NextUp';
import ContentSkeleton from '@/components/ui/Skeleton';
import { daysUntil } from '@/lib/ticket';

const COPY = {
    en: {
        hi: 'Hi', next: 'Next at the door', open: 'Open event', checkin: 'Open check-in', newEvent: 'New event', none: 'No event on the calendar.', noneSub: 'Post one and ushers start applying within hours.',
        needs: 'Needs you', nothingNeeds: 'You are clear. Nothing is waiting on you.', unfilled: 'events still need ushers', underfunded: 'events need payment', shortfall: 'EGP short',
        schedule: 'On the calendar', all: 'All events', report: 'Full report', staffing: 'Staffing', pay: 'Pay now', view: 'View', filled: 'filled',
    },
    ar: {
        hi: 'أهلاً', next: 'القادمة عند الباب', open: 'فتح الفعالية', checkin: 'فتح تسجيل الحضور', newEvent: 'فعالية جديدة', none: 'لا توجد فعالية في الجدول.', noneSub: 'أنشئ واحدة وسيبدأ المنظمون بالتقديم خلال ساعات.',
        needs: 'بانتظارك', nothingNeeds: 'كل شيء جاهز. لا شيء ينتظرك.', unfilled: 'فعاليات تحتاج منظمين', underfunded: 'فعاليات تحتاج دفعًا', shortfall: 'ج.م ناقصة',
        schedule: 'في الجدول', all: 'كل الفعاليات', report: 'التقرير الكامل', staffing: 'التوظيف', pay: 'ادفع الآن', view: 'عرض', filled: 'مكتمل',
    },
    'ar-eg': {
        hi: 'إزيك يا', next: 'الجاي عند الباب', open: 'افتح الإيفينت', checkin: 'افتح تسجيل الحضور', newEvent: 'إيفينت جديد', none: 'مفيش إيفينت في الجدول.', noneSub: 'اعمل واحد والأشرز هيقدموا في ساعات.',
        needs: 'مستنيك', nothingNeeds: 'كله تمام. مفيش حاجة مستنياك.', unfilled: 'إيفينتس لسه محتاجة أشرز', underfunded: 'إيفينتس محتاجة دفع', shortfall: 'ج.م ناقصة', schedule: 'في الجدول', all: 'كل الإيفينتس', report: 'التقرير الكامل', pay: 'ادفع دلوقتي', view: 'شوف',
    },
};

export default function ProviderDashboard() {
    const { user, isOrganizer } = useAuth();
    const c = useCopy(COPY);
    const [events, setEvents] = useState<Event[] | null>(null);
    const [alerts, setAlerts] = useState<{ events: number; amount: number } | null>(null);

    useEffect(() => {
        if (!user) return;
        getProviderProfileByUserId(user._id)
            .then((p) => p ? getProviderEvents(p._id) : null)
            .then((res) => setEvents(res ? res.data : []))
            .catch(() => setEvents([]));
        getAnalytics('organization').then((a) => setAlerts({ events: a.alerts.underfundedEvents, amount: a.alerts.underfundedAmountEgp })).catch(() => undefined);
    }, [user]);

    if (!events) return <ContentSkeleton variant="dashboard" />;

    const live = events.filter((e) => e.status === EventStatus.OPEN || e.status === EventStatus.CONFIRMED)
        .filter((e) => daysUntil(e.endDate || e.eventDate) >= 0)
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    const [next, ...rest] = live;
    const unfilled = live.filter((e) => e.hiredTalents.length < e.requiredCount);
    const needs = [
        ...(unfilled.length ? [{ key: 'u', value: String(unfilled.length), label: c.unfilled, href: `/provider/events/${unfilled[0]._id}`, action: c.view }] : []),
        ...(alerts && alerts.events > 0 ? [{ key: 'f', value: String(alerts.events), label: `${c.underfunded}, ${Math.round(alerts.amount).toLocaleString()} ${c.shortfall}`, href: '/provider/payments', action: c.pay }] : []),
    ];

    return (
        <div className="space-y-12 text-start">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <h1 className="display text-3xl sm:text-4xl">{c.hi} {user?.fullName?.split(' ')[0] || ''}</h1>
                {isOrganizer && <Link href="/provider/events/new" className="press hidden min-h-12 items-center rounded-xl bg-primary-500 px-6 font-bold text-on-primary md:inline-flex">{c.newEvent}</Link>}
            </header>

            {next ? (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    <NextUp event={next} label={c.next}>
                        <Link href={`/provider/events/${next._id}`} className="press inline-flex min-h-12 items-center rounded-lg bg-white px-6 font-semibold text-ink hover:bg-bottle-text">{c.open}</Link>
                        <Link href={`/provider/events/${next._id}/check-in`} className="press inline-flex min-h-12 items-center rounded-lg border border-white/40 px-6 font-semibold text-white hover:bg-white/10">{c.checkin}</Link>
                        <span className="text-sm text-bottle-text">{next.hiredTalents.length}/{next.requiredCount}</span>
                    </NextUp>
                    <section aria-label={c.needs} className="rounded-2xl border border-edge bg-dark-900 p-6">
                        <h2 className="display-sm text-2xl">{c.needs}</h2>
                        {needs.length ? (
                            <ul className="mt-5 space-y-5">
                                {needs.map((n) => (
                                    <li key={n.key} className="flex items-center gap-4">
                                        <span className="display grid size-14 shrink-0 place-items-center rounded-full bg-primary-500 text-3xl tabular-nums text-on-primary">{n.value}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium leading-snug">{n.label}</p>
                                            <Link href={n.href} className="mt-1 inline-block text-sm font-bold underline underline-offset-4">{n.action}</Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="mt-5 text-dark-300">{c.nothingNeeds}</p>}
                    </section>
                </div>
            ) : (
                <section className="rounded-2xl border border-dashed border-dark-500 p-10 text-center sm:p-14">
                    <p className="display text-4xl sm:text-5xl">{c.none}</p>
                    <p className="mx-auto mt-3 max-w-md text-dark-300">{c.noneSub}</p>
                    {isOrganizer && <Link href="/provider/events/new" className="press mt-6 inline-flex min-h-12 items-center rounded-xl bg-primary-500 px-7 font-bold text-on-primary">{c.newEvent}</Link>}
                </section>
            )}

            {rest.length > 0 && (
                <section aria-label={c.schedule} className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                        <h2 className="display-sm text-2xl">{c.schedule}</h2>
                        <Link href="/provider/events" className="text-sm font-bold underline underline-offset-4">{c.all}</Link>
                    </div>
                    <RowList>{rest.slice(0, 4).map((event) => <EventRow key={event._id} event={event} href={`/provider/events/${event._id}`} />)}</RowList>
                </section>
            )}

            <details className="group rounded-2xl border border-edge bg-dark-900 p-5 open:pb-8">
                <summary className="display-sm cursor-pointer list-none text-3xl">{c.report}</summary>
                <div className="mt-8"><AnalyticsDashboard scope="organization" /></div>
            </details>
        </div>
    );
}
