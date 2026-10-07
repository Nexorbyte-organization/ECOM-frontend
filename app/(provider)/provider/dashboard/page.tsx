'use client';

import Link from 'next/link';
import { CalendarDays, PlusCircle, Search } from 'lucide-react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import Card from '@/components/ui/Card';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';

export default function ProviderDashboard() {
    const { user, isOrganizer } = useAuth();
    const { t } = useLanguage();
    return <div className="space-y-8 text-start">
        <div><p className="text-sm font-semibold text-dark-400">{t('welcome_name')}, {user?.fullName}</p></div>
        <AnalyticsDashboard scope="organization" />
        <Card>
            <h2 className="mb-4 text-xs font-black text-dark-300">{t('quick_actions')}</h2>
            <div className="grid gap-2 sm:grid-cols-3">
                {isOrganizer && <Link href="/provider/events/new" className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-dark-300 hover:bg-dark-900 hover:text-dark-100 focus-visible:ring-2 focus-visible:ring-primary-400">
                    <PlusCircle size={18} className="text-primary-400" aria-hidden="true" />{t('action_create_event')}
                </Link>}
                <Link href="/provider/talent" className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-dark-300 hover:bg-dark-900 hover:text-dark-100 focus-visible:ring-2 focus-visible:ring-primary-400">
                    <Search size={18} className="text-accent-400" aria-hidden="true" />{t('action_search_talent')}
                </Link>
                <Link href="/provider/events" className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-dark-300 hover:bg-dark-900 hover:text-dark-100 focus-visible:ring-2 focus-visible:ring-primary-400">
                    <CalendarDays size={18} className="text-success-400" aria-hidden="true" />{t('action_view_events_provider')}
                </Link>
            </div>
        </Card>
    </div>;
}
