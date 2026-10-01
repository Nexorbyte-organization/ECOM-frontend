'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, CreditCard, LockKeyhole, RefreshCw, Send, ShieldCheck, Wallet } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import {
    closeEventApplications, getEventFunding, getOrganizerCards, releaseEventPayments, retrySettlementLinePayout,
    setEventFundingMode, startEventFunding,
} from '@/lib/api';
import { Event, EventFundingSummary, EventStatus, OrganizerCard } from '@/types';
import { egp, formatDateTime, holdStatus, lineStatus } from '@/components/payments/paymentLabels';

interface EventFundingCardProps {
    event: Event;
    isOwner: boolean;
    /** Bumped by the page after attendance changes so the release preview stays current. */
    refreshKey?: number;
    onEventChange?: (event: Event) => void;
    onSummary?: (summary: EventFundingSummary | null) => void;
}

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' | 'danger' }) => (
    <div className="rounded-xl border border-dark-700 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-dark-400">{label}</p>
        <p className={`mt-1 font-bold ${tone === 'success' ? 'text-success-500' : tone === 'warning' ? 'text-warning-500' : tone === 'danger' ? 'text-danger-400' : 'text-dark-50'}`}>{value}</p>
    </div>
);

const policyText = (summary: EventFundingSummary) => {
    const [full, half] = summary.cancellationPolicy.tiers;
    return `If OO-Ushers cancels this event: ${full?.minHoursBeforeStart ?? 72}h+ before the start, 100% returns to your credit; ${half?.minHoursBeforeStart ?? 24}–${full?.minHoursBeforeStart ?? 72}h before, 50% returns and 50% compensates the hired ushers; under ${half?.minHoursBeforeStart ?? 24}h, the hired ushers are compensated in full.`;
};

export default function EventFundingCard({ event, isOwner, refreshKey = 0, onEventChange, onSummary }: EventFundingCardProps) {
    const [summary, setSummary] = useState<EventFundingSummary | null>(null);
    const [cards, setCards] = useState<OrganizerCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [useCredit, setUseCredit] = useState(true);
    const [selectedCardId, setSelectedCardId] = useState('');

    const load = useCallback(async () => {
        setError('');
        try {
            const data = await getEventFunding(event._id);
            setSummary(data);
            onSummary?.(data);
            if (isOwner) {
                const saved = data.savedCards || await getOrganizerCards().catch(() => []);
                setCards(saved);
                setSelectedCardId((current) => current || data.pendingCheckout?.selectedCardId || saved.find((card) => card.isDefault)?._id || '');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load the event funding.');
            onSummary?.(null);
        } finally {
            setLoading(false);
        }
        // onSummary is a notification callback; reloading when its identity changes would loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event._id, isOwner]);

    useEffect(() => { void load(); }, [load, refreshKey, event.status, event.hiredTalents.length, event.budget, event.fundingMode]);

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

    if (loading) {
        return <Card><SkeletonGroup className="space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-16 w-full" /><Skeleton className="h-10 w-40" /></SkeletonGroup></Card>;
    }
    if (!summary) {
        return error ? <Card><p role="alert" className="text-sm text-danger-400">{error}</p></Card> : null;
    }

    const cancelled = event.status === EventStatus.CANCELLED;
    const completed = event.status === EventStatus.COMPLETED;
    const trusted = summary.tier.tier === 'trusted';
    const hasFunding = summary.fundings.some((funding) => ['paid', 'pending', 'not_started'].includes(funding.collectionStatus));
    const canSwitchMode = isOwner && !completed && !cancelled && !summary.released;
    const pending = summary.pendingCheckout;

    const closeButton = isOwner && event.status === EventStatus.OPEN && event.hiredTalents.length > 0 && (
        <Button
            variant="secondary" size="sm" icon={<LockKeyhole size={14} />} isLoading={busy === 'close'} disabled={Boolean(busy)}
            onClick={() => run('close', async () => { const updated = await closeEventApplications(event._id); onEventChange?.(updated); })}
        >
            Confirm team & close applications
        </Button>
    );

    if (summary.fundingMode === 'pay_after') {
        return (
            <Card className="border-primary-500/25">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Wallet size={18} className="text-primary-500" />
                            <h2 className="font-bold text-dark-50">Usher pay: paid after the event</h2>
                            {trusted && <Badge variant="success">Trusted organization</Badge>}
                        </div>
                        <p className="mt-1 max-w-xl text-sm text-dark-400">
                            You pay present ushers through the Attendance tab once the event is completed. Unpaid events 7 days after they end remove pay-after access.
                        </p>
                        {!trusted && !completed && !cancelled && (
                            <p className="mt-2 text-xs font-medium text-warning-500">Your organization must fund events in advance now. Switch this event to advance funding before confirming the team.</p>
                        )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                        {canSwitchMode && (
                            <Button variant="primary" size="sm" icon={<ShieldCheck size={14} />} isLoading={busy === 'mode'} disabled={Boolean(busy)}
                                onClick={() => run('mode', async () => { const updated = await setEventFundingMode(event._id, 'prefund'); onEventChange?.(updated); await load(); })}>
                                Fund in advance instead
                            </Button>
                        )}
                        {closeButton}
                    </div>
                </div>
                {error && <p role="alert" className="mt-3 text-sm text-danger-400">{error}</p>}
            </Card>
        );
    }

    const statusBadge = cancelled ? <Badge variant="default">Settled on cancellation</Badge>
        : summary.released ? <Badge variant="success">Released</Badge>
            : summary.fullyFunded ? <Badge variant="success">Pay secured</Badge>
                : summary.overdue ? <Badge variant="danger">Funding overdue</Badge>
                    : <Badge variant="warning">Funding due</Badge>;
    const creditPart = useCredit ? Math.min(summary.creditToApply, summary.shortfallAmount) : 0;
    const cardPart = Math.max(0, Math.round((summary.shortfallAmount - creditPart) * 100) / 100);
    const preview = summary.releasePreview;
    const lines = summary.settlements.flatMap((settlement) => settlement.lines.map((line) => ({ settlement, line })));

    return (
        <Card className="border-primary-500/25">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ShieldCheck size={18} className="text-primary-500" />
                        <h2 className="font-bold text-dark-50">Usher pay funding</h2>
                        {statusBadge}
                        <Badge variant="warning">TEST MODE</Badge>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-dark-400">
                        You fund the hired team in advance. OO-Ushers holds the money and releases it after the event: present ushers receive 95%, 5% is the platform fee, and anything unused returns to your credit.
                    </p>
                </div>
                <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={() => run('refresh', load)} isLoading={busy === 'refresh'} disabled={Boolean(busy)} className="shrink-0">
                    Refresh
                </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label={`Required (${summary.hiredCount} × ${egp(summary.perUsherAmount)})`} value={egp(summary.requiredAmount)} />
                <Stat label="Funded" value={egp(summary.fundedAmount)} tone={summary.fullyFunded ? 'success' : undefined} />
                <Stat label="Due now" value={egp(summary.shortfallAmount)} tone={summary.shortfallAmount > 0 ? (summary.overdue ? 'danger' : 'warning') : undefined} />
                <Stat label="Your credit" value={egp(summary.creditBalance)} />
            </div>

            {!summary.released && !cancelled && !completed && summary.deadline && (
                <p className={`mt-3 text-xs ${summary.overdue ? 'font-semibold text-danger-400' : 'text-dark-400'}`}>
                    {summary.overdue ? <AlertTriangle size={12} className="mr-1 inline" /> : null}
                    {summary.shortfallAmount > 0
                        ? `${summary.overdue ? 'Overdue — ' : ''}due by ${formatDateTime(summary.deadline)} (${summary.deadlineHours}h before the start). Hired ushers see that their pay is not secured yet.`
                        : `Hiring more ushers or raising the pay later must be funded by ${formatDateTime(summary.deadline)}.`}
                </p>
            )}
            {summary.surplusAmount > 0 && !summary.released && !cancelled && (
                <p className="mt-2 text-xs text-dark-400">{egp(summary.surplusAmount)} more than the current team needs is held; it returns to your credit when payments are released.</p>
            )}

            {pending && !cancelled && (
                <div className="mt-4 rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-sm">
                    {pending.active && pending.checkoutUrl ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-dark-200">A {egp(pending.amount)} checkout is open until {formatDateTime(pending.expiresAt)}.</span>
                            {isOwner && <Button size="sm" icon={<CreditCard size={14} />} onClick={() => window.location.assign(pending.checkoutUrl!)}>Continue checkout</Button>}
                        </div>
                    ) : (
                        <span className="text-dark-200">Waiting for Paymob to confirm the last {egp(pending.amount)} payment. Refresh in a few minutes.</span>
                    )}
                </div>
            )}

            {isOwner && !pending && summary.shortfallAmount > 0 && !cancelled && !summary.released && (
                <div className="mt-4 space-y-3 rounded-xl border border-dark-700 p-4">
                    {summary.creditBalance > 0 && (
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-dark-200">
                            <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} />
                            Use {egp(summary.creditToApply)} of my credit first
                        </label>
                    )}
                    {cardPart > 0 && (
                        <fieldset className="space-y-2">
                            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-dark-400">Pay {egp(cardPart)} with</legend>
                            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dark-700 p-2.5 text-sm text-dark-200">
                                <input type="radio" name={`funding-card-${event._id}`} checked={!selectedCardId} onChange={() => setSelectedCardId('')} />
                                Paymob checkout (enter a card or wallet)
                            </label>
                            {cards.map((card) => (
                                <label key={card._id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-dark-700 p-2.5 text-sm text-dark-200">
                                    <input type="radio" name={`funding-card-${event._id}`} checked={selectedCardId === card._id} onChange={() => setSelectedCardId(card._id)} />
                                    {card.cardSubtype || 'Card'} {card.maskedPan}{card.isDefault ? ' · default' : ''}
                                </label>
                            ))}
                        </fieldset>
                    )}
                    <Button
                        icon={<Wallet size={15} />} isLoading={busy === 'fund'} disabled={Boolean(busy)}
                        onClick={() => run('fund', async () => {
                            const result = await startEventFunding(event._id, { cardId: cardPart > 0 ? selectedCardId || undefined : undefined, useCredit });
                            if (result.checkoutUrl) { window.location.assign(result.checkoutUrl); return; }
                            await load();
                        })}
                    >
                        {cardPart > 0 ? `Fund ${egp(summary.shortfallAmount)}` : `Fund ${egp(summary.shortfallAmount)} from credit`}
                    </Button>
                </div>
            )}

            {(closeButton || (canSwitchMode && trusted && !hasFunding)) && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {summary.fullyFunded && closeButton}
                    {canSwitchMode && trusted && !hasFunding && (
                        <Button variant="ghost" size="sm" isLoading={busy === 'mode'} disabled={Boolean(busy)}
                            onClick={() => run('mode', async () => { const updated = await setEventFundingMode(event._id, 'pay_after'); onEventChange?.(updated); await load(); })}>
                            Pay after the event instead (trusted)
                        </Button>
                    )}
                </div>
            )}

            {preview && completed && (
                <div className="mt-5 border-t border-dark-700/60 pt-4">
                    <h3 className="font-semibold text-dark-50">Release payments</h3>
                    <p className="mt-1 text-xs text-dark-400">
                        Present and late ushers are paid now. Pay for absent ushers is held for {preview.disputeWindowHours} hours so they can dispute the mark; ushers who scanned the QR code cannot be marked absent.
                    </p>
                    <ul className="mt-3 space-y-2">
                        {preview.payable.map((usher) => (
                            <li key={usher.talentId} className="flex items-center justify-between gap-3 text-sm">
                                <span className="flex items-center gap-2 text-dark-200"><Avatar src={usher.photo} name={usher.fullName} size="sm" />{usher.fullName}</span>
                                <span className="text-right text-xs text-dark-300">
                                    {egp(usher.usherAmount || 0)} {usher.hasPayoutAccount ? '' : <span className="text-warning-500">· held until they add a payout account</span>}
                                </span>
                            </li>
                        ))}
                        {preview.absent.map((usher) => (
                            <li key={usher.talentId} className="flex items-center justify-between gap-3 text-sm">
                                <span className="flex items-center gap-2 text-dark-200"><Avatar src={usher.photo} name={usher.fullName} size="sm" />{usher.fullName}</span>
                                <Badge variant="warning">Absent · {egp(usher.amount || 0)} held</Badge>
                            </li>
                        ))}
                        {preview.unmarked.map((usher) => (
                            <li key={usher.talentId} className="flex items-center justify-between gap-3 text-sm">
                                <span className="flex items-center gap-2 text-dark-200"><Avatar src={usher.photo} name={usher.fullName} size="sm" />{usher.fullName}</span>
                                <Badge variant="danger">Mark attendance first</Badge>
                            </li>
                        ))}
                    </ul>
                    {preview.surplus > 0 && <p className="mt-3 text-xs text-dark-400">{egp(preview.surplus)} unused funding returns to your credit.</p>}
                    {preview.blockers.some((blocker) => blocker.code === 'underfunded') && (
                        <p className="mt-2 text-xs font-semibold text-danger-400">Fund the remaining {egp(summary.shortfallAmount)} before releasing.</p>
                    )}
                    {isOwner && (
                        <Button className="mt-3" variant="success" icon={<Send size={15} />} isLoading={busy === 'release'} disabled={!preview.canRelease || Boolean(busy)}
                            onClick={() => run('release', async () => { const next = await releaseEventPayments(event._id); setSummary(next); onSummary?.(next); onEventChange?.({ ...event, fundsReleasedAt: next.fundsReleasedAt }); })}>
                            Release usher payments
                        </Button>
                    )}
                </div>
            )}
            {preview && !completed && !cancelled && (
                <p className="mt-4 text-xs text-dark-400">After the event ends, mark it completed and record attendance to release the payments.</p>
            )}

            {(lines.length > 0 || summary.holds.length > 0) && (
                <div className="mt-5 border-t border-dark-700/60 pt-4">
                    <h3 className="font-semibold text-dark-50">{cancelled ? 'Cancellation compensation' : 'Usher payments'}</h3>
                    <ul className="mt-3 space-y-2">
                        {lines.map(({ settlement, line }) => {
                            const status = lineStatus(line);
                            return (
                                <li key={line._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span className="flex items-center gap-2 text-dark-200"><Avatar src={line.talent?.photo} name={line.talent?.fullName || 'Usher'} size="sm" />{line.talent?.fullName || 'Usher'}</span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-xs text-dark-300">{egp(line.usherAmount)}</span>
                                        <Badge variant={status.tone}>{status.label}</Badge>
                                        {isOwner && line.payoutStatus === 'failed' && line.payoutRetrySafe && (
                                            <Button size="sm" variant="secondary" isLoading={busy === line._id} disabled={Boolean(busy)}
                                                onClick={() => run(line._id, async () => { await retrySettlementLinePayout(settlement._id, line._id); await load(); })}>
                                                Retry payout
                                            </Button>
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                        {summary.holds.filter((hold) => hold.status !== 'paid_to_usher').map((hold) => {
                            const status = holdStatus(hold);
                            return (
                                <li key={hold._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <span className="flex items-center gap-2 text-dark-200"><Avatar src={hold.talent?.photo} name={hold.talent?.fullName || 'Usher'} size="sm" />{hold.talent?.fullName || 'Usher'}</span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-xs text-dark-300">{egp(hold.amount)}</span>
                                        <Badge variant={status.tone}>{status.label}</Badge>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    {summary.holds.some((hold) => ['held', 'disputed'].includes(hold.status)) && (
                        <p className="mt-2 text-xs text-dark-400">If an absent mark was a mistake, change that usher to present or late in the Attendance tab and their held pay is sent.</p>
                    )}
                    {lines.some(({ line }) => line.payoutStatus === 'awaiting_method') && (
                        <p className="mt-2 text-xs text-dark-400">Ushers without a payout account were notified; their pay is sent automatically once they add one.</p>
                    )}
                </div>
            )}

            {!summary.released && !cancelled && !completed && (
                <p className="mt-4 text-xs text-dark-500">{policyText(summary)}{summary.cancellationPolicy.currentRefundPercent !== null ? ` Right now: ${summary.cancellationPolicy.currentRefundPercent}% would return.` : ''}</p>
            )}
            {summary.released && (
                <p className="mt-4 flex items-center gap-1 text-xs text-success-500"><CheckCircle2 size={13} /> Released {formatDateTime(summary.fundsReleasedAt)}.</p>
            )}
            {isOwner && <Link href="/provider/payments" className="mt-3 inline-block text-xs font-semibold text-primary-500 hover:underline">Credit balance and payment history →</Link>}
            {error && <p role="alert" className="mt-3 text-sm text-danger-400">{error}</p>}
        </Card>
    );
}
