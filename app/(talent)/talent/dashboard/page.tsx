'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { useCopy } from '@/lib/copy';
import { burstAt } from '@/lib/burst';
import { getTalentProfileByUserId, getTalentDashboardStats, isVerifiedTalent, getTalentPendingReferrals, acceptReferral, declineReferral, getOpenEvents } from '@/lib/api';
import { TalentProfile, Referral, Event } from '@/types';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Ticket from '@/components/ui/Ticket';
import GigTicket from '@/components/events/GigTicket';
import NextUp from '@/components/events/NextUp';
import { useProfileCompletion } from '@/components/shared/ProfileCompletionGate';
import { toneFor } from '@/lib/ticket';
import { formatEventDates } from '@/lib/utils';

const COPY = {
    en: {
        hey: 'Hey', next: 'Your next shift', open: 'Open details', checkin: 'Check in', nothing: 'Nothing booked yet.', nothingSub: 'Fresh gigs are waiting. Grab one before it fills.', browse: 'Find a gig',
        offers: 'Friends sent you gigs', coming: 'Coming up', fresh: 'Fresh gigs', all: 'See all gigs', verified: 'Verified',
        reliable: 'Reliable', rating: 'Rating', done: 'Gigs done', waiting: 'Waiting on replies', left: 'left', invited: 'sent you', accept: 'Accept', decline: 'Decline',
    },
    ar: {
        hey: 'أهلاً', next: 'وردّيتك القادمة', open: 'عرض التفاصيل', checkin: 'تسجيل الحضور', nothing: 'لا توجد حجوزات بعد.', nothingSub: 'فرص جديدة بانتظارك. احجز واحدة قبل أن تمتلئ.', browse: 'ابحث عن فرصة',
        offers: 'أصدقاؤك رشّحوك', coming: 'قادمًا', fresh: 'فرص جديدة', all: 'كل الفرص', verified: 'موثّق',
        reliable: 'الالتزام', rating: 'التقييم', done: 'فرص منجزة', waiting: 'بانتظار الرد', left: 'متبقية', invited: 'رشّحك', accept: 'قبول', decline: 'رفض',
    },
    'ar-eg': {
        hey: 'إزيك يا', next: 'شغلك الجاي', nothing: 'لسه مفيش حاجة محجوزة.', nothingSub: 'فيه شغل جديد مستنيك. الحق واحد قبل ما يتملي.', browse: 'دوّر على شغل',
        offers: 'صحابك رشحوك', coming: 'جاي قريب', fresh: 'شغل جديد', all: 'كل الشغل', waiting: 'مستني ردّ', left: 'فاضل', invited: 'رشّحك',
    },
};

export default function TalentDashboard() {
    const { user } = useAuth();
    const { isComplete: isProfileComplete, isChecking: isCheckingProfile } = useProfileCompletion();
    const { t } = useLanguage();
    const c = useCopy(COPY);
    const [profile, setProfile] = useState<TalentProfile | null>(null);
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getTalentDashboardStats>> | null>(null);
    const [pendingReferrals, setPendingReferrals] = useState<(Referral & { event: Event; referrer: TalentProfile })[]>([]);
    const [fresh, setFresh] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState('');

    const fetchData = async () => {
        if (!user) return;
        const p = await getTalentProfileByUserId(user._id);
        setProfile(p);
        if (p) {
            const [s, refs] = await Promise.all([getTalentDashboardStats(p._id), getTalentPendingReferrals(p._id)]);
            setStats(s);
            setPendingReferrals(refs);
            getOpenEvents({ limit: 6 }).then((res) => setFresh(res.data)).catch(() => undefined);
        }
        setLoading(false);
    };

    // Reload the dashboard when the authenticated user changes.
    useEffect(() => {
        void fetchData().catch((err) => {
            setError(err instanceof Error ? err.message : 'Could not load dashboard.');
            setLoading(false);
        });
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleReferral = async (referralId: string, accept: boolean, target: Element | null) => {
        setActionLoading(referralId);
        setError('');
        try {
            if (accept) { await acceptReferral(referralId); burstAt(target); } else await declineReferral(referralId);
            setPendingReferrals((prev) => prev.filter((r) => r._id !== referralId));
        } catch (err) {
            setError(err instanceof Error ? err.message : accept ? 'Could not accept referral.' : 'Could not decline referral.');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <ContentSkeleton variant="dashboard" />;

    const upcoming = stats?.upcomingEvents ?? [];
    const [next, ...later] = upcoming;
    const bookedIds = new Set(upcoming.map((e) => e._id));
    const freshGigs = fresh.filter((e) => !bookedIds.has(e._id) && e.hiredTalents.length < e.requiredCount).slice(0, 3);
    const record = [
        { value: `${stats?.reliabilityScore ?? 0}%`, label: c.reliable },
        { value: `${stats?.ratingAverage ?? 0}`, label: `${c.rating} (${stats?.totalRatings ?? 0})` },
        { value: String(stats?.completedEventsCount ?? 0), label: c.done },
    ];

    return (
        <div className="space-y-10 text-start">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}

            <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-4">
                    <Avatar src={profile?.photo} name={profile?.fullName || ''} size="lg" />
                    <div>
                        <h1 className="display text-5xl sm:text-6xl">{c.hey} {profile?.fullName?.split(' ')[0] || ''}</h1>
                        {profile && isVerifiedTalent(profile) && <p className="mt-1 text-sm font-semibold text-success-500">{c.verified}</p>}
                    </div>
                </div>
                <dl className="grid grid-cols-3 divide-x divide-dashed divide-dark-500 rtl:divide-x-reverse md:min-w-[26rem]">
                    {record.map((r) => (
                        <div key={r.label} className="px-4 first:ps-0">
                            <dd className="display text-4xl tabular-nums">{r.value}</dd>
                            <dt className="mt-1 text-xs text-dark-300">{r.label}</dt>
                        </div>
                    ))}
                </dl>
            </header>

            {next ? (
                <NextUp event={next} label={c.next}>
                    <Link href={`/talent/jobs/${next._id}`} className="press inline-flex min-h-12 items-center rounded-lg bg-ticket-ink px-6 text-base font-semibold text-white">{c.checkin}</Link>
                    <Link href={`/talent/jobs/${next._id}`} className="press inline-flex min-h-12 items-center rounded-lg border-2 border-ticket-ink px-6 text-base font-semibold">{c.open}</Link>
                </NextUp>
            ) : (
                <section className="rounded-2xl border-2 border-dashed border-dark-500 p-8 text-center sm:p-12">
                    <p className="display text-4xl sm:text-5xl">{c.nothing}</p>
                    <p className="mx-auto mt-3 max-w-md text-dark-300">{c.nothingSub}</p>
                    <Link href="/talent/jobs" className="press mt-6 inline-flex min-h-12 items-center rounded-lg bg-accent-400 px-7 text-base font-semibold text-ticket-ink">{c.browse}</Link>
                </section>
            )}

            {pendingReferrals.length > 0 && (
                <section aria-label={c.offers}>
                    <h2 className="display-sm text-3xl">{c.offers}</h2>
                    <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
                        {pendingReferrals.map((ref) => (
                            <div key={ref._id} className="w-[85%] shrink-0 snap-start sm:w-[26rem]">
                                <Ticket date={ref.event.eventDate} tone={toneFor(ref.event.category)}>
                                    <div className="flex items-center gap-2.5">
                                        <Avatar src={ref.referrer.photo} name={ref.referrer.fullName} size="sm" />
                                        <p className="text-sm text-dark-300"><span className="font-semibold text-dark-50">{ref.referrer.fullName}</span> {c.invited}</p>
                                    </div>
                                    <h3 className="display-sm mt-2 text-xl">{ref.event.title}</h3>
                                    <p className="mt-1 text-sm text-dark-300">{ref.event.location}, {formatEventDates(ref.event)}</p>
                                    <div className="mt-4 flex gap-2">
                                        <Button size="sm" disabled={isCheckingProfile || !isProfileComplete} isLoading={actionLoading === ref._id} onClick={(e) => handleReferral(ref._id, true, e.currentTarget)}>{t('accept') || c.accept}</Button>
                                        <Button size="sm" variant="secondary" disabled={isCheckingProfile || !isProfileComplete} isLoading={actionLoading === ref._id} onClick={(e) => handleReferral(ref._id, false, e.currentTarget)}>{t('decline') || c.decline}</Button>
                                    </div>
                                </Ticket>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {later.length > 0 && (
                <section aria-label={c.coming} className="space-y-3">
                    <h2 className="display-sm text-3xl">{c.coming}</h2>
                    {later.map((event) => <GigTicket key={event._id} event={event} href={`/talent/jobs/${event._id}`} />)}
                </section>
            )}

            {freshGigs.length > 0 && (
                <section aria-label={c.fresh} className="space-y-3">
                    <div className="flex items-end justify-between gap-4">
                        <h2 className="display-sm text-3xl">{c.fresh}</h2>
                        <Link href="/talent/jobs" className="text-sm font-semibold underline underline-offset-4">{c.all}</Link>
                    </div>
                    {freshGigs.map((event) => (
                        <GigTicket key={event._id} event={event} href={`/talent/jobs/${event._id}`}
                            aside={<span className="display-sm text-lg tabular-nums">{event.budget} <span className="font-sans text-xs font-medium text-dark-300">EGP</span></span>} />
                    ))}
                </section>
            )}

            {(stats?.pendingApplications ?? 0) > 0 && (
                <p className="text-sm text-dark-300">
                    <Link href="/talent/events" className="font-semibold text-dark-50 underline underline-offset-4">{stats?.pendingApplications} {c.waiting}</Link>
                </p>
            )}
        </div>
    );
}
