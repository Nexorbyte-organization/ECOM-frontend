'use client';

import React, { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/lib/i18n';
import { disputeAbsenceHold, getMyAbsenceHolds } from '@/lib/api';
import { AbsenceHold } from '@/types';
import { egp, formatDateTime } from '@/components/payments/paymentLabels';

const MAX_REASON = 1000;

// Pay held because the organization marked the usher absent, with the option to dispute it.
export default function HeldPayList() {
    const { language } = useLanguage();
    const ar = language !== 'en';
    const [holds, setHolds] = useState<AbsenceHold[]>([]);
    const [disputing, setDisputing] = useState<AbsenceHold | null>(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getMyAbsenceHolds().then(setHolds).catch(() => setHolds([]));
    }, []);

    if (!holds.length) return null;

    const statusOf = (hold: AbsenceHold) => {
        if (hold.status === 'held') return { variant: 'warning' as const, text: ar ? `محجوز حتى ${formatDateTime(hold.releaseAfter)}` : `Held until ${formatDateTime(hold.releaseAfter)}` };
        if (hold.status === 'disputed') return { variant: 'info' as const, text: ar ? 'قيد المراجعة' : 'Under review' };
        if (hold.status === 'paid_to_usher') return { variant: 'success' as const, text: ar ? 'تم صرفه لك' : 'Paid to you' };
        return { variant: 'default' as const, text: ar ? 'أعيد للجهة المنظمة' : 'Returned to the organization' };
    };

    const submit = async () => {
        if (!disputing || !reason.trim()) return;
        setBusy(true);
        setError('');
        try {
            const updated = await disputeAbsenceHold(disputing._id, reason.trim());
            setHolds((items) => items.map((item) => item._id === updated._id ? { ...item, ...updated, canDispute: false } : item));
            setDisputing(null);
            setReason('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send the dispute.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Card className="border-warning-500/30">
            <div className="flex items-center gap-2">
                <Scale size={18} className="text-warning-500" />
                <h2 className="font-bold text-dark-50">{ar ? 'أجر محجوز بسبب تسجيل غياب' : 'Pay held for an absent mark'}</h2>
            </div>
            <p className="mt-1 text-sm text-dark-400">
                {ar
                    ? 'إذا حضرت الفعالية وسُجلت غائبًا بالخطأ، اعترض قبل انتهاء المهلة وسيراجع فريق OO-Ushers الأمر.'
                    : 'If you attended and were marked absent by mistake, dispute it before the deadline and OO-Ushers will review it.'}
            </p>
            <ul className="mt-3 divide-y divide-dark-700/60">
                {holds.map((hold) => {
                    const status = statusOf(hold);
                    return (
                        <li key={hold._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-dark-100">{hold.event?.title || (ar ? 'فعالية' : 'Event')}</p>
                                <p className="text-xs text-dark-400">{egp(hold.amount)}{hold.organization?.fullName ? ` · ${hold.organization.fullName}` : ''}</p>
                                {hold.resolutionNote && <p className="mt-1 text-xs text-dark-400">{hold.resolutionNote}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={status.variant}>{status.text}</Badge>
                                {hold.canDispute && (
                                    <Button size="sm" variant="secondary" onClick={() => { setDisputing(hold); setError(''); }}>
                                        {ar ? 'اعتراض' : 'Dispute'}
                                    </Button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            <Modal isOpen={Boolean(disputing)} onClose={() => setDisputing(null)} title={ar ? 'الاعتراض على تسجيل الغياب' : 'Dispute the absent mark'}>
                <div className="space-y-3">
                    <p className="text-sm text-dark-300">
                        {ar
                            ? 'اشرح ما حدث (مثل وقت وصولك ومن قابلت). يمكنك الاعتراض مرة واحدة فقط.'
                            : 'Explain what happened, for example when you arrived and who you reported to. You can dispute only once.'}
                    </p>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON))}
                        rows={5}
                        className="w-full rounded-xl border border-dark-700 bg-dark-900 p-3 text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
                        aria-label={ar ? 'سبب الاعتراض' : 'Dispute reason'}
                    />
                    <p className="text-right text-[11px] text-dark-500">{reason.length}/{MAX_REASON}</p>
                    {error && <p role="alert" className="text-sm text-danger-400">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setDisputing(null)}>{ar ? 'إلغاء' : 'Cancel'}</Button>
                        <Button onClick={submit} isLoading={busy} disabled={busy || !reason.trim()}>{ar ? 'إرسال الاعتراض' : 'Send dispute'}</Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
}
