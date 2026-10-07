'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getTalentProfileByUserId, getTalentDashboardStats, isVerifiedTalent, getTalentPendingReferrals, acceptReferral, declineReferral } from '@/lib/api';
import { TalentProfile, Referral, Event } from '@/types';
import StatsCard from '@/components/shared/StatsCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useProfileCompletion } from '@/components/shared/ProfileCompletionGate';
import Avatar from '@/components/ui/Avatar';
import { Shield, Star, CalendarDays, Clock, Briefcase, TrendingUp, UserPlus, Check, X, MapPin } from 'lucide-react';
import { formatEventDates, formatEventHours } from '@/lib/utils';
import Link from 'next/link';

export default function TalentDashboard() {
    const { user } = useAuth();
    const { isComplete: isProfileComplete, isChecking: isCheckingProfile } = useProfileCompletion();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<TalentProfile | null>(null);
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getTalentDashboardStats>> | null>(null);
    const [pendingReferrals, setPendingReferrals] = useState<(Referral & { event: Event; referrer: TalentProfile })[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState('');

    const fetchData = async () => {
        if (!user) return;
        const p = await getTalentProfileByUserId(user._id);
        setProfile(p);
        if (p) {
            const [s, refs] = await Promise.all([
                getTalentDashboardStats(p._id),
                getTalentPendingReferrals(p._id),
            ]);
            setStats(s);
            setPendingReferrals(refs);
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

    const handleAcceptReferral = async (referralId: string) => {
        setActionLoading(referralId);
        setError('');
        try {
            await acceptReferral(referralId);
            setPendingReferrals((prev) => prev.filter((r) => r._id !== referralId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not accept referral.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeclineReferral = async (referralId: string) => {
        setActionLoading(referralId);
        setError('');
        try {
            await declineReferral(referralId);
            setPendingReferrals((prev) => prev.filter((r) => r._id !== referralId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not decline referral.');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <ContentSkeleton variant="dashboard" />;
    }

    return (
        <div className="space-y-8 animate-fade-in text-start">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            {/* Welcome */}
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-dark-50">
                        {t('welcome_back_name')}, <span className="gradient-text">{profile?.fullName || 'Talent'}</span>
                    </h1>
                    {profile && isVerifiedTalent(profile) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success-500/15 border border-success-500/30 text-success-600 text-xs font-black">
                            ✓ {t('verified_label')}
                        </span>
                    )}
                </div>
                <p className="text-dark-400 mt-1 font-semibold">{t('account_summary')}</p>
            </div>

            {/* Pending Referrals */}
            {pendingReferrals.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-dark-300 uppercase tracking-wider flex items-center gap-2">
                        <UserPlus size={14} className="text-primary-400" />
                        {t('pending_referrals_count')} ({pendingReferrals.length})
                    </h3>
                    {pendingReferrals.map((ref) => (
                        <Card key={ref._id} className="border-primary-500/20">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Avatar src={ref.referrer.photo} name={ref.referrer.fullName} size="md" />
                                    <div>
                                        <p className="text-sm text-dark-200">
                                            <span className="font-bold text-dark-100">{ref.referrer.fullName}</span> {t('referred_to')}
                                        </p>
                                        <p className="text-sm font-black text-dark-50 mt-0.5">{ref.event.title}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-dark-400 flex items-center gap-1"><MapPin size={11} /> {ref.event.location}</span>
                                            <span className="text-xs text-dark-400 flex items-center gap-1"><CalendarDays size={11} /> {formatEventDates(ref.event)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="success"
                                        icon={<Check size={14} />}
                                        onClick={() => handleAcceptReferral(ref._id)}
                                        isLoading={actionLoading === ref._id}
                                        disabled={isCheckingProfile || !isProfileComplete}
                                        className="font-black"
                                    >
                                        {t('accept')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        icon={<X size={14} />}
                                        onClick={() => handleDeclineReferral(ref._id)}
                                        isLoading={actionLoading === ref._id}
                                        disabled={isCheckingProfile || !isProfileComplete}
                                        className="font-black"
                                    >
                                        {t('decline')}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <StatsCard
                    label={t('stat_reliability')}
                    value={`${stats?.reliabilityScore ?? 0}%`}
                    icon={<Shield size={20} />}
                />
                <StatsCard
                    label={t('stat_rating')}
                    value={`${stats?.ratingAverage ?? 0} ★`}
                    icon={<Star size={20} />}
                />
                <StatsCard
                    label={t('stat_upcoming')}
                    value={stats?.upcomingEventsCount ?? 0}
                    icon={<CalendarDays size={20} />}
                />
                <StatsCard
                    label={t('stat_pending')}
                    value={stats?.pendingApplications ?? 0}
                    icon={<Clock size={20} />}
                />
            </div>

            {/* Quick Actions + Upcoming Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="lg:col-span-1">
                  <h3 className="text-xs font-black text-dark-300 uppercase tracking-wider mb-4">{t('quick_actions')}</h3>
                    <div className="space-y-2">
                        <Link
                            href="/talent/jobs"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-900 text-dark-300 hover:text-dark-100 transition-colors"
                        >
                            <Briefcase size={18} className="text-primary-400" />
                            <span className="text-sm font-bold">{t('action_browse_jobs')}</span>
                        </Link>
                        <Link
                            href="/talent/profile"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-900 text-dark-300 hover:text-dark-100 transition-colors"
                        >
                            <TrendingUp size={18} className="text-success-400" />
                            <span className="text-sm font-bold">{t('action_update_profile')}</span>
                        </Link>
                        <Link
                            href="/talent/events"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-900 text-dark-300 hover:text-dark-100 transition-colors"
                        >
                            <CalendarDays size={18} className="text-accent-400" />
                            <span className="text-sm font-bold">{t('action_view_events')}</span>
                        </Link>
                    </div>
                </Card>

                {/* Upcoming Events */}
                <Card className="lg:col-span-2">
                    <h3 className="text-xs font-black text-dark-300 uppercase tracking-wider mb-4">{t('stat_upcoming')}</h3>
                    {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                        <div className="space-y-3">
                            {stats.upcomingEvents.map((event) => (
                                <div key={event._id} className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-950 hover:bg-dark-850 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-dark-100">{event.title}</p>
                                        <p className="text-xs text-dark-400 mt-0.5">
                                            {formatEventDates(event)} · {formatEventHours(event)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="primary">{event.category}</Badge>
                                        <Badge variant="success">{event.hiredTalents.length}/{event.requiredCount} {t('spots')}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CalendarDays size={32} className="mx-auto text-dark-600 mb-2" />
                            <p className="text-sm text-dark-500 font-semibold">{t('no_upcoming_events')}</p>
                            <Link href="/talent/jobs" className="text-xs text-primary-555 hover:text-primary-450 mt-1 inline-block font-bold">
                                {t('browse_jobs_arrow')}
                            </Link>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
