'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, CalendarDays, CircleDollarSign, RefreshCw, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import ContentSkeleton from '@/components/ui/Skeleton';
import { Analytics, getAnalytics } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';

type Scope = 'organization' | 'platform';
type CopyKey = keyof typeof english;

const english = {
    title: 'Analytics', subtitle: 'Live totals from the database · all time unless noted',
    events: 'Events', hires: 'Booked ushers', applications: 'Applications', collected: 'Gross online collected',
    activity: 'Event activity', lastYear: 'Events created in the last 12 months',
    status: 'Event status', categories: 'Event categories', staffing: 'Staffing and quality',
    positions: 'Required positions', bookedValue: 'Booked usher value', direct: 'Direct invitations',
    attendance: 'Attendance', qr: 'QR check-ins', referrals: 'Referrals', reviews: 'Reviews', average: 'Average rating',
    finance: 'Payments and balances', paidFunding: 'Paid advance funding', cardFunding: 'Card funding',
    creditFunding: 'Credit applied to events', paidSettlements: 'Paid checkout collections',
    fees: 'Fees in paid settlements', noShowFees: 'No-show fees retained', payouts: 'Usher payouts', credit: 'Organization credit balance',
    refunds: 'Card refunds',
    people: 'People', users: 'Users by role', staff: 'Organization staff', favorites: 'Favorite ushers',
    blocked: 'Blocked accounts', verified: 'Verified accounts', recent: 'Recent events',
    attention: 'Needs attention', underfunded: 'Events needing funding', shortfall: 'Funding shortfall',
    pendingRequests: 'Pending event requests', flagged: 'Flagged ushers',
    leaders: 'Platform leaders', topOrganizations: 'Most active organizations', topUshers: 'Top rated ushers',
    completed: 'completed', rating: 'rating',
    noEvents: 'No events yet', empty: 'No data yet', retry: 'Try again',
    error: 'Could not load analytics.',
} as const;
const arabic: Record<CopyKey, string> = {
    title: 'التحليلات', subtitle: 'إجماليات مباشرة من قاعدة البيانات · لكل الفترات ما لم يُذكر غير ذلك',
    events: 'الفعاليات', hires: 'المضيفون المحجوزون', applications: 'الطلبات', collected: 'إجمالي المبالغ المحصلة إلكترونياً',
    activity: 'نشاط الفعاليات', lastYear: 'فعاليات أُنشئت خلال آخر ١٢ شهراً',
    status: 'حالة الفعاليات', categories: 'فئات الفعاليات', staffing: 'التوظيف والجودة',
    positions: 'الوظائف المطلوبة', bookedValue: 'قيمة حجوزات المضيفين', direct: 'الدعوات المباشرة',
    attendance: 'الحضور', qr: 'تسجيلات QR', referrals: 'الترشيحات', reviews: 'التقييمات', average: 'متوسط التقييم',
    finance: 'المدفوعات والأرصدة', paidFunding: 'التمويل المسبق المدفوع', cardFunding: 'التمويل بالبطاقة',
    creditFunding: 'الرصيد المستخدم للفعاليات', paidSettlements: 'المدفوعات المحصلة',
    fees: 'الرسوم في التسويات المدفوعة', noShowFees: 'رسوم الغياب المحتفظ بها', payouts: 'مستحقات المضيفين', credit: 'رصيد المؤسسات',
    refunds: 'المبالغ المستردة للبطاقة',
    people: 'الأشخاص', users: 'المستخدمون حسب الدور', staff: 'فريق المؤسسة', favorites: 'المضيفون المفضلون',
    blocked: 'حسابات محظورة', verified: 'حسابات موثقة', recent: 'أحدث الفعاليات',
    attention: 'يحتاج متابعة', underfunded: 'فعاليات تحتاج تمويلاً', shortfall: 'نقص التمويل',
    pendingRequests: 'طلبات فعاليات معلقة', flagged: 'مضيفون عليهم تنبيهات',
    leaders: 'الأبرز في المنصة', topOrganizations: 'المؤسسات الأكثر نشاطاً', topUshers: 'المضيفون الأعلى تقييماً',
    completed: 'مكتملة', rating: 'التقييم',
    noEvents: 'لا توجد فعاليات بعد', empty: 'لا توجد بيانات بعد', retry: 'حاول مجدداً',
    error: 'تعذر تحميل التحليلات.',
};

const eventStatuses = ['open', 'confirmed', 'completed', 'cancelled'];
const applicationStatuses = ['pending', 'accepted', 'standby', 'rejected', 'excused', 'withdrawn'];
const attendanceStatuses = ['present', 'late', 'absent'];
const payoutStatuses = ['paid', 'cash_due', 'queued', 'processing', 'awaiting_method', 'failed'];
const refundStatuses = ['pending', 'processing', 'succeeded', 'failed'];

function humanize(value: string) { return value.replaceAll('_', ' '); }
const arabicValue: Record<string, string> = {
    open: 'مفتوحة', confirmed: 'مؤكدة', completed: 'مكتملة', cancelled: 'ملغاة',
    wedding: 'زفاف', corporate: 'شركات', club: 'نادي', festival: 'مهرجان',
    private_party: 'حفل خاص', conference: 'مؤتمر', exhibition: 'معرض', sport_event: 'حدث رياضي',
    pending: 'معلق', accepted: 'مقبول', standby: 'احتياطي', rejected: 'مرفوض',
    excused: 'معذور', withdrawn: 'منسحب', present: 'حاضر', late: 'متأخر', absent: 'غائب',
    declined: 'مرفوض', paid: 'مدفوع', cash_due: 'نقد مستحق', queued: 'في الانتظار',
    processing: 'قيد المعالجة', awaiting_method: 'بانتظار وسيلة الدفع', failed: 'فشل',
    held: 'محتجز', disputed: 'متنازع عليه', returned_to_organizer: 'عاد للمؤسسة',
    paid_to_usher: 'دُفع للمضيف', succeeded: 'نجح', usher: 'مضيف', organizer: 'مؤسسة', admin: 'مدير النظام',
    organizer_member: 'عضو المؤسسة', organizer_supervisor: 'مشرف المؤسسة',
};
function labelFor(value: string, language: string) {
    return language === 'en' ? humanize(value) : arabicValue[value] || humanize(value);
}
function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return <Card className="min-w-0">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-dark-400">{label}</p>
                <p className="mt-2 break-words text-2xl font-bold tabular-nums text-dark-50">{value}</p></div>
            <span className="rounded-xl bg-primary-500/10 p-2.5 text-primary-400" aria-hidden="true">{icon}</span>
        </div>
    </Card>;
}
function Rows({ values, format, empty }: { values: [string, number][]; format: (value: number) => string; empty: string }) {
    const { language } = useLanguage();
    return values.length ? <dl className="space-y-2">
        {values.map(([key, value]) => <div key={key} className="flex items-center justify-between gap-4 border-b border-dark-700/50 py-1.5 last:border-0">
            <dt className="min-w-0 capitalize text-sm text-dark-300">{labelFor(key, language)}</dt>
            <dd className="shrink-0 font-semibold tabular-nums text-dark-50">{format(value)}</dd>
        </div>)}
    </dl> : <p className="text-sm text-dark-400">{empty}</p>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return <Card><h2 className="mb-4 text-base font-bold text-dark-100">{title}</h2>{children}</Card>;
}

export default function AnalyticsDashboard({ scope }: { scope: Scope }) {
    const { language } = useLanguage();
    const copy = language === 'en' ? english : arabic;
    const locale = language === 'en' ? 'en-EG' : 'ar-EG';
    const count = (value: number) => new Intl.NumberFormat(locale).format(value);
    const egp = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value);
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const load = useCallback(() => {
        setLoading(true);
        setError('');
        getAnalytics(scope).then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : copy.error))
            .finally(() => setLoading(false));
    }, [scope, copy.error]);
    useEffect(() => {
        let active = true;
        getAnalytics(scope).then((result) => { if (active) setData(result); })
            .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : english.error); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [scope]);

    if (loading) return <ContentSkeleton variant="dashboard" />;
    if (error || !data) return <div role="alert" className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-5 text-danger-400">
        <p>{error || copy.error}</p><button type="button" onClick={load} className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-primary-400 focus-visible:ring-2 focus-visible:ring-primary-400">
            <RefreshCw size={16} aria-hidden="true" />{copy.retry}</button></div>;

    const { events, staffing, finance, people, alerts } = data;
    const totalApplications = Object.values(staffing.applications).reduce((sum, value) => sum + value, 0);
    const onlineCollected = (finance.paidFunding.paymob?.amountEgp || 0) + (finance.settlements.paid?.amountEgp || 0);
    const monthly = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(data.generatedAt); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - 11 + index);
        const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
        return { month, count: events.monthlyCreated.find((item) => item.month === month)?.count || 0 };
    });
    const maxMonth = Math.max(1, ...monthly.map((item) => item.count));
    const eventUrl = (id: string) => scope === 'platform' ? '/admin/events' : `/provider/events/${id}`;

    return <div className="space-y-6 text-start">
        <div><h1 className="text-2xl font-bold text-dark-50">{copy.title}</h1><p className="mt-1 text-sm text-dark-400">{copy.subtitle}</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label={copy.events} value={count(events.total)} icon={<CalendarDays size={20} />} />
            <Metric label={copy.hires} value={count(events.hires)} icon={<Users size={20} />} />
            <Metric label={copy.applications} value={count(totalApplications)} icon={<Activity size={20} />} />
            <Metric label={copy.collected} value={egp(onlineCollected)} icon={<CircleDollarSign size={20} />} />
        </div>
        <section aria-label={copy.attention}>
            <h2 className="mb-3 text-base font-bold text-dark-100">{copy.attention}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label={copy.underfunded} value={count(alerts.underfundedEvents)} icon={<AlertTriangle size={20} />} />
                <Metric label={copy.shortfall} value={egp(alerts.underfundedAmountEgp)} icon={<CircleDollarSign size={20} />} />
                {scope === 'platform' && <><Metric label={copy.pendingRequests} value={count(alerts.pendingEventRequests)} icon={<Activity size={20} />} />
                    <Metric label={copy.flagged} value={count(alerts.flaggedUshers)} icon={<Users size={20} />} /></>}
            </div>
        </section>
        <div className="grid gap-6 xl:grid-cols-2">
            <Section title={copy.activity}>
                <p className="mb-4 text-xs text-dark-400">{copy.lastYear}</p>
                <div className="flex h-32 items-end gap-1.5" role="img" aria-label={monthly.map(({ month, count: value }) => `${month}: ${count(value)}`).join(', ')}>
                    {monthly.map(({ month, count: value }) => <div key={month} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${month}: ${count(value)}`}>
                        <div className="min-h-1 rounded-t bg-primary-500" style={{ height: `${Math.max(3, value / maxMonth * 100)}%` }} />
                    </div>)}
                </div>
                <div className="mt-2 flex justify-between text-xs text-dark-400"><span>{monthly[0].month}</span><span>{monthly[11].month}</span></div>
            </Section>
            <Section title={copy.status}><Rows values={eventStatuses.map((key) => [key, events.byStatus[key] || 0])} format={count} empty={copy.empty} /></Section>
            <Section title={copy.categories}><Rows values={Object.entries(events.byCategory)} format={count} empty={copy.empty} />
                <div className="mt-4 border-t border-dark-700 pt-3"><Rows values={[[copy.positions, events.positions]]} format={count} empty={copy.empty} />
                    <Rows values={[[copy.bookedValue, events.bookedValueEgp]]} format={egp} empty={copy.empty} /></div>
            </Section>
            <Section title={copy.staffing}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-400">{copy.applications}</h3>
                <Rows values={applicationStatuses.map((key) => [key, staffing.applications[key] || 0])} format={count} empty={copy.empty} />
                <div className="mt-3 border-t border-dark-700 pt-3"><Rows values={[[copy.direct, staffing.directInvitations], [copy.qr, staffing.qrCheckIns], [copy.reviews, staffing.reviews.count], [copy.average, staffing.reviews.average]]} format={count} empty={copy.empty} /></div>
                <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-dark-400">{copy.attendance}</h3>
                <Rows values={attendanceStatuses.map((key) => [key, staffing.attendance[key] || 0])} format={count} empty={copy.empty} />
                <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-dark-400">{copy.referrals}</h3>
                <Rows values={Object.entries(staffing.referrals)} format={count} empty={copy.empty} />
            </Section>
        </div>
        <Section title={copy.finance}>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div><h3 className="mb-2 text-sm font-semibold text-dark-200">{copy.paidFunding}</h3>
                    <Rows values={[[copy.cardFunding, finance.paidFunding.paymob?.amountEgp || 0], [copy.creditFunding, finance.paidFunding.credit?.amountEgp || 0]]} format={egp} empty={copy.empty} /></div>
                <div><h3 className="mb-2 text-sm font-semibold text-dark-200">{copy.paidSettlements}</h3>
                    <Rows values={[[copy.paidSettlements, finance.settlements.paid?.amountEgp || 0], [copy.fees, finance.settlements.paid?.feeEgp || 0], [copy.noShowFees, finance.noShowFeesEgp], [copy.credit, finance.creditBalanceEgp]]} format={egp} empty={copy.empty} />
                    <Rows values={Object.entries(finance.settlements).map(([key, value]) => [key, value.count])} format={count} empty={copy.empty} /></div>
                <div><h3 className="mb-2 text-sm font-semibold text-dark-200">{copy.payouts}</h3>
                    <Rows values={payoutStatuses.map((key) => [key, finance.payouts[key]?.amountEgp || 0])} format={egp} empty={copy.empty} /></div>
                <div><h3 className="mb-2 text-sm font-semibold text-dark-200">{copy.refunds}</h3>
                    <Rows values={refundStatuses.map((key) => [key, finance.cardRefunds[key]?.amountEgp || 0])} format={egp} empty={copy.empty} /></div>
            </div>
        </Section>
        <div className="grid gap-6 xl:grid-cols-2">
            <Section title={copy.people}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-400">{scope === 'platform' ? copy.users : copy.staff}</h3>
                <Rows values={Object.entries(scope === 'platform' ? people.usersByRole || {} : people.staffByRole || {})} format={count} empty={copy.empty} />
                <div className="mt-3 border-t border-dark-700 pt-3"><Rows values={scope === 'platform'
                    ? [[copy.blocked, people.blocked || 0], [copy.verified, people.verified || 0], [copy.favorites, people.favorites]]
                    : [[copy.favorites, people.favorites]]} format={count} empty={copy.empty} /></div>
            </Section>
            <Section title={copy.recent}>
                {events.recent.length ? <ul className="space-y-2">{events.recent.map((event) => <li key={event.id}>
                    <Link href={eventUrl(event.id)} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-dark-700 p-3 hover:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-400">
                        <span className="min-w-0"><span className="block truncate font-semibold text-dark-100">{event.title}</span>
                            <span className="text-xs text-dark-400">{scope === 'platform' ? `${event.organization} · ` : ''}{count(event.hires)}/{count(event.requiredCount)}</span></span>
                        <span className="shrink-0 capitalize text-xs text-dark-300">{labelFor(event.status, language)}</span>
                    </Link></li>)}</ul> : <p className="text-sm text-dark-400">{copy.noEvents}</p>}
            </Section>
        </div>
        {scope === 'platform' && <Section title={copy.leaders}>
            <div className="grid gap-6 md:grid-cols-2">
                <div><h3 className="mb-3 text-sm font-semibold text-dark-200">{copy.topOrganizations}</h3>
                    {people.topOrganizations?.length ? <ol className="space-y-2">{people.topOrganizations.map((organization) => <li key={organization.id} className="flex justify-between gap-3 border-b border-dark-700/50 py-2 last:border-0">
                        <span className="min-w-0 truncate text-sm text-dark-100">{organization.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-dark-300">{count(organization.events)} {copy.events} · {count(organization.completed)} {copy.completed}</span>
                    </li>)}</ol> : <p className="text-sm text-dark-400">{copy.empty}</p>}</div>
                <div><h3 className="mb-3 text-sm font-semibold text-dark-200">{copy.topUshers}</h3>
                    {people.topUshers?.length ? <ol className="space-y-2">{people.topUshers.map((usher) => <li key={usher.id} className="flex justify-between gap-3 border-b border-dark-700/50 py-2 last:border-0">
                        <span className="min-w-0 truncate text-sm text-dark-100">{usher.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-dark-300">{count(usher.rate)} {copy.rating} · {count(usher.completed)} {copy.completed}</span>
                    </li>)}</ol> : <p className="text-sm text-dark-400">{copy.empty}</p>}</div>
            </div>
        </Section>}
        <p className="text-xs text-dark-500">{new Date(data.generatedAt).toLocaleString(locale)}</p>
    </div>;
}
