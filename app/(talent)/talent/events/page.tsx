'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getTalentProfileByUserId, getTalentApplications, getTalentProfile, excuseFromEvent } from '@/lib/api';
import { Application, Event, TalentProfile } from '@/types';
import Tabs from '@/components/ui/Tabs';
import EventRow from '@/components/events/EventRow';
import { RowList } from '@/components/ui/Ticket';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { LogOut, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function TalentEventsPage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const isArabic = language === 'ar' || language === 'ar-eg';
    const [profile, setProfile] = useState<TalentProfile | null>(null);
    const [applications, setApplications] = useState<(Application & { event: Event })[]>([]);
    const [referrerNames, setReferrerNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('all');
    const [excuseModal, setExcuseModal] = useState<{ open: boolean; app: (Application & { event: Event }) | null }>({ open: false, app: null });
    const [excusing, setExcusing] = useState(false);
    const [excuseResult, setExcuseResult] = useState<{ isLate: boolean; lateExcuseCount: number } | null>(null);
    const [error, setError] = useState('');

    const fetchData = async () => {
        if (!user) return;
        const p = await getTalentProfileByUserId(user._id);
        if (!p) return setLoading(false);
        setProfile(p);
        const apps = await getTalentApplications(p._id);
        setApplications(apps);
        const names: Record<string, string> = {};
        for (const app of apps) {
            if (app.referredBy) {
                const referrer = await getTalentProfile(app.referredBy);
                if (referrer) names[app.referredBy] = referrer.fullName;
            }
        }
        setReferrerNames(names);
        setLoading(false);
    };

    // Reload the event list when the authenticated user changes.
    useEffect(() => {
        void fetchData().catch((err) => {
            setError(err instanceof Error ? err.message : 'Could not load events.');
            setLoading(false);
        });
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleExcuse = async () => {
        if (!profile || !excuseModal.app) return;
        setExcusing(true);
        setError('');
        try {
            const result = await excuseFromEvent(profile._id, excuseModal.app.eventId);
            setExcuseResult(result);
            await fetchData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not submit excuse.');
        } finally {
            setExcusing(false);
        }
    };

    const closeExcuseModal = () => {
        setExcuseModal({ open: false, app: null });
        setExcuseResult(null);
    };

    const now = new Date();
    const filtered = applications.filter((a) => {
        if (tab === 'upcoming') return new Date(a.event.endDate || a.event.eventDate) >= now;
        if (tab === 'past') return new Date(a.event.endDate || a.event.eventDate) < now;
        return true;
    });

    const statusVariant = (s: string) =>
        s === 'accepted' ? 'success' as const :
            s === 'rejected' ? 'danger' as const :
                s === 'standby' ? 'info' as const :
                    s === 'excused' || s === 'withdrawn' ? 'default' as const :
                        'warning' as const;

    const getTabLabel = (type: 'all' | 'upcoming' | 'past') => {
        const labels: Record<string, string> = {
            all: isArabic ? 'الكل' : 'All',
            upcoming: isArabic ? 'فعاليات قادمة' : 'Upcoming',
            past: isArabic ? 'فعاليات سابقة' : 'Past'
        };
        return labels[type];
    };

    if (loading) {
        return <ContentSkeleton variant="list" />;
    }

    const countFor = (type: 'all' | 'upcoming' | 'past') => applications.filter((a) => {
        if (type === 'upcoming') return new Date(a.event.endDate || a.event.eventDate) >= now;
        if (type === 'past') return new Date(a.event.endDate || a.event.eventDate) < now;
        return true;
    }).length;

    return (
        <div className="space-y-8 text-start">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <header>
                <h1 className="display text-3xl sm:text-4xl">{t('nav_my_events')}</h1>
                <p className="mt-2 max-w-[52ch] text-dark-300">
                    {isArabic
                        ? 'يوم الفعالية سجّل حضورك من هاتفك: امسح رمز المشرف أو اكتب الكود أو اضغط "أنا هنا". من لا يسجل حضوره يُعتبر غائبًا ولا يحصل على أجر.'
                        : 'On the event day, check in with your phone: scan the staff QR, type its code, or tap “I’m here”. Anyone who does not check in counts as a no-show and is not paid.'}
                </p>
            </header>

            {/* Set automatically after repeated missed check-ins; lifts on its own. */}
            {profile?.suspendedUntil && new Date(profile.suspendedUntil) > new Date() && (
                <p role="alert" className="rounded-lg border-2 border-danger-500 bg-danger-500/10 p-3 text-sm font-medium text-danger-500">
                    {isArabic
                        ? `لا يمكنك قبول فعاليات جديدة حتى ${formatDate(profile.suspendedUntil)} بسبب عدم تسجيل الحضور ٣ مرات خلال ٩٠ يومًا.`
                        : `You cannot take new events until ${formatDate(profile.suspendedUntil)} because you missed check-in 3 times within 90 days.`}
                </p>
            )}

            <Tabs label={t('nav_my_events')} value={tab} onChange={setTab}
                items={(['all', 'upcoming', 'past'] as const).map((value) => ({ value, label: getTabLabel(value), count: countFor(value) }))} />

            {filtered.length === 0 ? (
                <section className="rounded-2xl border border-dashed border-dark-500 p-10 text-center">
                    <p className="display text-4xl">{isArabic ? 'مفيش حاجة هنا' : 'Nothing here yet'}</p>
                    <Link href="/talent/jobs" className="press mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary-500 px-6 font-bold text-on-primary">
                        {isArabic ? 'تصفح الوظائف المتاحة' : 'Browse jobs'}
                    </Link>
                </section>
            ) : (
                <RowList>
                    {filtered.map((app) => (
                        <EventRow key={app._id} event={app.event} href={`/talent/jobs/${app.event._id}`}
                            aside={<Badge variant={statusVariant(app.status)}>{app.status}</Badge>}
                            footer={(
                                <div className="flex flex-wrap items-center gap-2">
                                    {app.isDirect && <Badge variant="info">{app.standbyInvite ? (isArabic ? 'دعوة احتياط' : 'Standby invitation') : (isArabic ? 'حجز مباشر' : 'Direct Booking')}</Badge>}
                                    {app.status === 'rejected' && app.standbySince && <Badge variant="default">{isArabic ? 'انتهى الاحتياط' : 'Standby ended'}</Badge>}
                                    {app.isDirect && app.status === 'pending' && <Badge variant="warning">{isArabic ? 'بانتظار ردك' : 'Awaiting your answer'}</Badge>}
                                    {app.referredBy && <Badge variant="info">{isArabic ? `ترشيح من ${referrerNames[app.referredBy] || ''}` : `Referred by ${referrerNames[app.referredBy] || ''}`}</Badge>}
                                    {/* Excuse & WhatsApp for accepted events */}
                                    {app.status === 'accepted' && new Date(app.event.eventDate) >= now && (
                                        <>
                                            {app.event.whatsappGroupLink && (
                                                <a href={app.event.whatsappGroupLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-edge bg-cat-teal px-3 text-xs font-bold text-ink">
                                                    <MessageCircle size={14} />{isArabic ? 'مجموعة واتساب' : 'WhatsApp'}
                                                </a>
                                            )}
                                            <Button variant="ghost" size="sm" icon={<LogOut size={14} />}
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExcuseModal({ open: true, app }); }}
                                                className="text-dark-300 hover:text-danger-500">
                                                {t('excuse_btn')}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )} />
                    ))}
                </RowList>
            )}

            {/* Excuse Confirmation Modal */}
            <Modal isOpen={excuseModal.open} onClose={closeExcuseModal} title={t('excuse_modal_title')}>
                {error && <p role="alert" className="mb-4 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
                {excuseResult ? (
                    <div className="space-y-4 text-start">
                        <div className={`p-4 rounded-xl border-2 ${excuseResult.isLate ? 'bg-warning-500/10 border-warning-500/30' : 'bg-success-500/10 border-success-500/30'}`}>
                            {excuseResult.isLate ? (
                                <>
                                    <p className="text-sm font-black text-warning-600 mb-1">⚠️ {t('late_excuse_alert')}</p>
                                    <p className="text-xs text-dark-300 font-semibold leading-relaxed">
                                        {t('excuse_warning_text')}
                                        <br />
                                        {isArabic 
                                            ? `لديك الآن ${excuseResult.lateExcuseCount} اعتذارات متأخرة.` 
                                            : `You now have ${excuseResult.lateExcuseCount} late excuse(s).`}
                                        {excuseResult.lateExcuseCount >= 5 && (
                                            <span className="block mt-1 text-danger-555 font-black">
                                                ⛔ {isArabic 
                                                    ? 'لقد وصلت إلى الحد الأقصى (5 اعتذارات متأخرة). سيتم إظهار علامة تحذير بملفك الشخصي. احضر 5 فعاليات لتصفيتها.'
                                                    : 'You have reached 5 late excuses. This will appear as a warning on your profile. Attend 5 events to clear it.'}
                                            </span>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-black text-success-600 mb-1">✓ {t('excused_success')}</p>
                                    <p className="text-xs text-dark-300 font-semibold">
                                        {t('excuse_ok_text')}
                                    </p>
                                </>
                            )}
                        </div>
                        <Button onClick={closeExcuseModal} className="w-full font-black">{t('done')}</Button>
                    </div>
                ) : (
                    <div className="space-y-4 text-start">
                        <p className="text-sm text-dark-300 font-semibold">
                            {t('excuse_confirm_prompt')} <strong className="text-dark-100">{excuseModal.app?.event.title}</strong>?
                        </p>
                        {excuseModal.app && (() => {
                            const deadline = new Date(excuseModal.app.event.applicationDeadline);
                            const daysLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                            const isLate = daysLeft <= 3;
                            return (
                                <div className={`p-3 rounded-xl text-xs border-2 font-bold ${isLate ? 'bg-warning-500/10 border-warning-500/20 text-warning-600' : 'bg-dark-900 border-dark-950 text-dark-400'}`}>
                                    {isLate ? (
                                        <>⚠️ {t('excuse_warning_text')}</>
                                    ) : (
                                        <>✓ {t('excuse_ok_text')}</>
                                    )}
                                </div>
                            );
                        })()}
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={closeExcuseModal} className="flex-1 font-black">{t('cancel_btn')}</Button>
                            <Button variant="danger" onClick={handleExcuse} isLoading={excusing} className="flex-1 font-black">
                                {t('confirm_excuse')}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
