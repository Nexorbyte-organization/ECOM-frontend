'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getProviderProfileByUserId, getProviderDashboardStats } from '@/lib/api';
import { ProviderProfile } from '@/types';
import StatsCard from '@/components/shared/StatsCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { CalendarDays, Users, Clock, PlusCircle, Search, Briefcase } from 'lucide-react';
import { formatEventDates } from '@/lib/utils';
import Link from 'next/link';

export default function ProviderDashboard() {
    const { user, isOrganizer } = useAuth();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<ProviderProfile | null>(null);
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getProviderDashboardStats>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        getProviderProfileByUserId(user._id).then(async (p) => {
            setProfile(p);
            if (p) {
                setStats(await getProviderDashboardStats(p._id));
            }
        }).catch((err) => setError(err instanceof Error ? err.message : 'Could not load dashboard.'))
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) {
        return <ContentSkeleton variant="dashboard" />;
    }

    const statusVariant = (s: string) =>
        s === 'open' ? 'success' as const : s === 'confirmed' ? 'primary' as const : s === 'completed' ? 'default' as const : 'danger' as const;

    return (
        <div className="space-y-8 animate-fade-in text-start">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <div>
                <h1 className="text-2xl font-black text-dark-50">
                    {t('welcome_name')}, <span className="gradient-text">{profile?.companyName || 'Provider'}</span>
                </h1>
                <p className="text-dark-400 mt-1 font-semibold">{t('provider_summary')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <StatsCard label={t('stat_total_events')} value={stats?.totalEvents ?? 0} icon={<CalendarDays size={20} />} />
                <StatsCard label={t('stat_active_events')} value={stats?.activeEventsCount ?? 0} icon={<Briefcase size={20} />} />
                <StatsCard label={t('stat_total_hired')} value={stats?.totalHired ?? 0} icon={<Users size={20} />} />
                <StatsCard label={t('stat_pending_apps')} value={stats?.pendingApplicationsCount ?? 0} icon={<Clock size={20} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="lg:col-span-1">
                    <h3 className="text-xs font-black text-dark-300 uppercase tracking-wider mb-4">{t('quick_actions')}</h3>
                    <div className="space-y-2">
                        {isOrganizer && (
                            <Link
                                href="/provider/events/new"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-900 text-dark-300 hover:text-dark-100 transition-colors"
                            >
                                <PlusCircle size={18} className="text-primary-400" />
                                <span className="text-sm font-bold">{t('action_create_event')}</span>
                            </Link>
                        )}
                        <Link
                            href="/provider/talent"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-900 text-dark-300 hover:text-dark-100 transition-colors"
                        >
                            <Search size={18} className="text-accent-400" />
                            <span className="text-sm font-bold">{t('action_search_talent')}</span>
                        </Link>
                        <Link
                            href="/provider/events"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-900 text-dark-300 hover:text-dark-100 transition-colors"
                        >
                            <CalendarDays size={18} className="text-success-400" />
                            <span className="text-sm font-bold">{t('action_view_events_provider')}</span>
                        </Link>
                    </div>
                </Card>

                {/* Recent Events */}
                <Card className="lg:col-span-2">
                    <h3 className="text-xs font-black text-dark-300 uppercase tracking-wider mb-4">{t('recent_events')}</h3>
                    {stats?.recentEvents && stats.recentEvents.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentEvents.map((event) => (
                                <Link key={event._id} href={`/provider/events/${event._id}`}>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-950 hover:bg-dark-850 transition-colors">
                                        <div>
                                            <p className="text-sm font-bold text-dark-100">{event.title}</p>
                                            <p className="text-xs text-dark-400 mt-0.5 font-semibold">
                                                {formatEventDates(event)} · {event.hiredTalents.length}/{event.requiredCount} {t('hired')}
                                            </p>
                                        </div>
                                        <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CalendarDays size={32} className="mx-auto text-dark-600 mb-2" />
                            <p className="text-sm text-dark-500 font-semibold">{t('no_events_yet')}</p>
                            {isOrganizer && (
                                <Link href="/provider/events/new" className="text-xs text-primary-555 hover:text-primary-450 mt-1 inline-block font-bold">
                                    {t('create_first_event')}
                                </Link>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
