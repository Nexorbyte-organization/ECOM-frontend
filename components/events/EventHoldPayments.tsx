'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, CreditCard, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { closeEventApplications, getEventHoldSummary, getOrganizerCards, startEventHold } from '@/lib/api';
import { Event, EventStatus, HoldDay, HoldDayState, OrganizerCard, PreauthFundingSummary } from '@/types';
import { egp, formatDateTime } from '@/components/payments/paymentLabels';

interface EventHoldPaymentsProps {
    event: Event;
    isOwner: boolean;
    /** Bumped by the page after attendance changes so the panel stays current. */
    refreshKey?: number;
    onEventChange?: (event: Event) => void;
}

const dayTitle = (day: HoldDay) => `Day ${day.dayIndex + 1}`;
const dayDate = (day: HoldDay) => new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const STATE_BADGE: Record<HoldDayState, { label: string; tone: 'success' | 'warning' | 'danger' | 'default' | 'primary' }> = {
    scheduled: { label: 'Not open yet', tone: 'default' },
    awaiting_hold: { label: 'Hold needed', tone: 'warning' },
    pending: { label: 'Checkout open', tone: 'warning' },
    authorized: { label: 'Pay held', tone: 'success' },
    captured: { label: 'Settled', tone: 'success' },
    voided: { label: 'Released', tone: 'default' },
    unsecured: { label: 'Hold overdue', tone: 'danger' },
};

const dayNote = (day: HoldDay, summary: PreauthFundingSummary) => {
    switch (day.state) {
        case 'scheduled': return `You can place this hold from ${formatDateTime(day.opensAt)} (${summary.holdLeadDays} days before the day).`;
        case 'awaiting_hold': return `Authorize it by ${formatDateTime(day.deadline)}. Only ushers who check in are charged.`;
        case 'pending': return 'Finish the Paymob checkout to place the hold.';
        case 'authorized': return `${egp(day.holdAmount)} is held on your card. After the day, ushers who checked in are charged and the rest is released ${formatDateTime(day.captureDueAt)}.`;
        case 'captured': return `${egp(day.capturedAmount ?? 0)} was charged to your card for ushers who checked in; the other ${egp(Math.max(0, day.holdAmount - (day.capturedAmount ?? 0)))} was released.`;
        case 'voided': return 'The hold was released. Nothing was charged for this day.';
        default: return 'The hold is overdue, so this day’s pay is not secured. Place it now.';
    }
};

export default function EventHoldPayments({ event, isOwner, refreshKey = 0, onEventChange }: EventHoldPaymentsProps) {
    const [summary, setSummary] = useState<PreauthFundingSummary | null>(null);
    const [cards, setCards] = useState<OrganizerCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setError('');
        try {
            const data = await getEventHoldSummary(event._id);
            setSummary(data);
            if (isOwner) {
                const saved = data.savedCards || await getOrganizerCards().catch(() => []);
                setCards(saved);
                setSelectedCardId((current) => current || saved.find((card) => card.isDefault)?._id || '');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load the event payments.');
        } finally {
            setLoading(false);
        }
    }, [event._id, isOwner]);

    useEffect(() => { void load(); }, [load, refreshKey, event.status, event.hiredTalents.length]);

    const run = async (key: string, action: () => Promise<void>) => {
        setBusy(key);
        setError('');
        try {
            await action();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setBusy(null);
        }
    };

    const pay = (key: string, options: { kind: 'fee' | 'day_hold'; dayIndex?: number }) => run(key, async () => {
        const result = await startEventHold(event._id, { ...options, cardId: selectedCardId || undefined });
        if (result.checkoutUrl) { window.location.assign(result.checkoutUrl); return; }
        await load();
    });

    if (loading) {
        return <Card><SkeletonGroup className="space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-16 w-full" /><Skeleton className="h-10 w-40" /></SkeletonGroup></Card>;
    }
    if (!summary) {
        return error ? <Card><p role="alert" className="text-sm text-danger-400">{error}</p></Card> : null;
    }

    const cancelled = event.status === EventStatus.CANCELLED;
    const completed = event.status === EventStatus.COMPLETED;
    const active = !cancelled && !completed && !summary.fundsReleasedAt;
    const feePending = summary.fee.pendingCheckout;
    const statusBadge = cancelled ? <Badge variant="default">Settled on cancellation</Badge>
        : summary.protection === 'released' ? <Badge variant="success">All days settled</Badge>
            : summary.protection === 'secured' ? <Badge variant="success">Pay secured</Badge>
                : summary.protection === 'hold_pending' ? <Badge variant="primary">Holds open day by day</Badge>
                    : <Badge variant="warning">Payment needed</Badge>;

    const continueOrStart = (key: string, pending: PreauthFundingSummary['fee']['pendingCheckout'], label: string, options: { kind: 'fee' | 'day_hold'; dayIndex?: number }) => (
        pending?.checkoutUrl && pending.expiresAt && new Date(pending.expiresAt) > new Date()
            ? <Button size="sm" icon={<CreditCard size={14} />} onClick={() => window.location.assign(pending.checkoutUrl!)}>Continue checkout</Button>
            : <Button size="sm" icon={<CreditCard size={14} />} isLoading={busy === key} disabled={Boolean(busy)} onClick={() => void pay(key, options)}>{label}</Button>
    );

    return (
        <Card>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ShieldCheck size={20} className="text-dark-300" />
                        <h2 className="display-sm text-2xl text-dark-50">Usher pay</h2>
                        {statusBadge}
                        <Badge variant="warning">TEST MODE</Badge>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-dark-400">
                        You pay a non-refundable {egp(summary.fee.amount)} booking fee for the whole team. The ushers’ pay is never charged in advance: shortly before each day you hold it on your card, and after the day only the ushers who checked in are charged. The rest of the hold is released.{summary.dayCount > 1 && ` This event runs on ${summary.dayCount} days, so each day is held and settled separately.`}
                    </p>
                </div>
                <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={() => run('refresh', load)} isLoading={busy === 'refresh'} disabled={Boolean(busy)} className="shrink-0">
                    Refresh
                </Button>
            </div>

            {isOwner && active && cards.length > 0 && (
                <fieldset className="mt-4 space-y-2">
                    <legend className="mb-1 text-xs font-semibold text-dark-400">Pay with</legend>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dark-700 p-2.5 text-sm text-dark-200">
                        <input type="radio" name={`hold-card-${event._id}`} checked={!selectedCardId} onChange={() => setSelectedCardId('')} />
                        Paymob checkout (enter a card)
                    </label>
                    {cards.map((card) => (
                        <label key={card._id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-dark-700 p-2.5 text-sm text-dark-200">
                            <input type="radio" name={`hold-card-${event._id}`} checked={selectedCardId === card._id} onChange={() => setSelectedCardId(card._id)} />
                            {card.cardSubtype || 'Card'} {card.maskedPan}{card.isDefault ? ' · default' : ''}
                        </label>
                    ))}
                </fieldset>
            )}

            <div className="mt-5 flex flex-col gap-2 border-y border-dark-600 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold text-dark-400">Booking fee · not refundable</p>
                    <p className="mt-1 display-sm text-3xl tabular-nums text-dark-50">
                        {egp(summary.fee.amount)}
                        <span className="ms-3 font-sans text-xs font-normal text-dark-400">
                            {egp(summary.perUsherDayFee)} × {summary.requiredCount} ushers × {summary.dayCount} {summary.dayCount === 1 ? 'day' : 'days'}
                        </span>
                    </p>
                </div>
                {summary.fee.paid
                    ? <Badge variant="success">Paid</Badge>
                    : isOwner && active
                        ? continueOrStart('fee', feePending, `Pay ${egp(summary.fee.amount)} booking fee`, { kind: 'fee' })
                        : <Badge variant="warning">Due</Badge>}
            </div>

            <ul className="border-b border-dark-600">
                {summary.days.map((day) => {
                    const badge = STATE_BADGE[day.state];
                    const needsHold = (day.state === 'awaiting_hold' || day.state === 'unsecured' || day.state === 'pending') && active;
                    return (
                        <li key={day.dayIndex} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 border-t border-dark-600 py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                            <div>
                                <p className="display-sm text-xl text-primary-500">{dayTitle(day)}</p>
                                <p className="mt-0.5 text-xs text-dark-400">{dayDate(day)}</p>
                            </div>
                            <div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant={badge.tone}>{badge.label}</Badge>
                                        <span className="text-xs text-dark-400">Hold {egp(day.holdAmount)}</span>
                                    </div>
                                    {isOwner && needsHold && continueOrStart(`day-${day.dayIndex}`, day.pendingCheckout, `Authorize ${egp(day.holdAmount)} hold`, { kind: 'day_hold', dayIndex: day.dayIndex })}
                                </div>
                                <p className={`mt-1.5 text-xs ${day.state === 'unsecured' ? 'font-semibold text-danger-400' : 'text-dark-400'}`}>
                                    {day.state === 'unsecured' && <AlertTriangle size={12} className="me-1 inline" />}
                                    {dayNote(day, summary)}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {isOwner && event.status === EventStatus.OPEN && event.hiredTalents.length > 0 && (
                <div className="mt-4">
                    <Button
                        variant="secondary" size="sm" icon={<LockKeyhole size={14} />} isLoading={busy === 'close'} disabled={Boolean(busy) || !summary.fee.paid}
                        title={summary.fee.paid ? undefined : 'Pay the booking fee first'}
                        onClick={() => run('close', async () => { const updated = await closeEventApplications(event._id); onEventChange?.(updated); await load(); })}
                    >
                        Confirm team & close applications
                    </Button>
                </div>
            )}

            {active && (
                <p className="mt-4 text-xs text-dark-500">
                    If the booking fee or the first day’s hold is missing 24 hours before the event starts, the event is cancelled automatically. If OO-Ushers cancels the event close to a day, ushers receive compensation from that day’s hold (none 72h+ before, half 24–72h before, full under 24h); the booking fee is kept.
                </p>
            )}
            {summary.fundsReleasedAt && (
                <p className="mt-4 flex items-center gap-1 text-xs text-success-500"><CheckCircle2 size={13} /> All payments settled {formatDateTime(summary.fundsReleasedAt)}.</p>
            )}
            {isOwner && <Link href="/provider/payments" className="mt-3 inline-block text-xs font-semibold text-primary-500 underline underline-offset-4">Payment history</Link>}
            {error && <p role="alert" className="mt-3 text-sm text-danger-400">{error}</p>}
        </Card>
    );
}
