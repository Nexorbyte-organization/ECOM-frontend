'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Ban, Landmark, ShieldCheck, Wallet } from 'lucide-react';
import ContentSkeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/lib/auth';
import { cancelCreditWithdrawal, getOrganizerCredit, requestCreditWithdrawal } from '@/lib/api';
import { OrganizerCreditOverview } from '@/types';
import { CREDIT_ENTRY_LABELS, TIER_REASON_LABELS, egp, formatDateTime } from '@/components/payments/paymentLabels';

export default function ProviderPaymentsPage() {
    const { isOrganizer } = useAuth();
    const [overview, setOverview] = useState<OrganizerCreditOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [amount, setAmount] = useState('');
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setOverview(await getOrganizerCredit());
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load payments.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    if (!isOrganizer) {
        return <Card className="mx-auto max-w-2xl text-center text-sm text-dark-400">Only the organization owner can manage payments and credit.</Card>;
    }
    if (loading) return <ContentSkeleton variant="dashboard" className="mx-auto max-w-4xl" />;
    if (!overview) return <Card className="mx-auto max-w-2xl"><p role="alert" className="text-sm text-danger-400">{error}</p></Card>;

    const { tier } = overview;
    const parsedAmount = Number(amount);
    const amountValid = Number.isFinite(parsedAmount) && parsedAmount >= 1 && parsedAmount <= overview.balance
        && Math.abs(parsedAmount * 100 - Math.round(parsedAmount * 100)) < 1e-6;

    const submitWithdrawal = async () => {
        if (!amountValid) return;
        setBusy('withdraw');
        setError('');
        try {
            setOverview(await requestCreditWithdrawal(parsedAmount));
            setAmount('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not request the withdrawal.');
        } finally {
            setBusy(null);
        }
    };

    const cancelWithdrawal = async (withdrawalId: string) => {
        setBusy(withdrawalId);
        setError('');
        try {
            setOverview(await cancelCreditWithdrawal(withdrawalId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not cancel the withdrawal.');
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-dark-50">Payments</h1>
                <p className="mt-1 text-sm text-dark-400">Your credit from unused event funding, refunds, and how you pay for ushers.</p>
            </div>
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <div className="flex items-center gap-2 text-dark-300"><Wallet size={18} className="text-primary-500" /><h2 className="font-bold text-dark-50">Credit balance</h2></div>
                    <p className={`mt-3 text-3xl font-black ${overview.balance < 0 ? 'text-danger-400' : 'text-dark-50'}`}>{egp(overview.balance)}</p>
                    <p className="mt-2 text-xs text-dark-400">Credit is used first the next time you fund an event. {overview.activeHolds > 0 && `${overview.activeHolds} absent usher payment(s) are still in their dispute window.`}</p>

                    {overview.pendingWithdrawal ? (
                        <div className="mt-4 rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-sm">
                            <p className="text-dark-200">Withdrawal of {egp(overview.pendingWithdrawal.amount)} requested {formatDateTime(overview.pendingWithdrawal.createdAt)} and waiting for review.</p>
                            <Button className="mt-2" size="sm" variant="secondary" icon={<Ban size={14} />} isLoading={busy === overview.pendingWithdrawal._id} disabled={Boolean(busy)}
                                onClick={() => cancelWithdrawal(overview.pendingWithdrawal!._id)}>
                                Cancel request
                            </Button>
                        </div>
                    ) : overview.balance >= 1 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-dark-400">Withdraw to your bank</p>
                            <div className="flex gap-2">
                                <Input type="number" inputMode="decimal" min={1} max={overview.balance} step="0.01" placeholder={`Up to ${overview.balance}`} value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Withdrawal amount in EGP" />
                                <Button icon={<Landmark size={15} />} isLoading={busy === 'withdraw'} disabled={!amountValid || Boolean(busy)} onClick={submitWithdrawal} className="shrink-0">Request</Button>
                            </div>
                            <p className="text-xs text-dark-500">OO-Ushers reviews the request and transfers the money to your company account. The amount is reserved until then.</p>
                        </div>
                    )}
                </Card>

                <Card>
                    <div className="flex flex-wrap items-center gap-2"><ShieldCheck size={18} className="text-primary-500" /><h2 className="font-bold text-dark-50">How you pay for ushers</h2>
                        <Badge variant={tier.tier === 'trusted' ? 'success' : 'default'}>{tier.tier === 'trusted' ? 'Trusted' : 'Standard'}</Badge>
                        {tier.override && <Badge variant="info">Set by OO-Ushers</Badge>}
                    </div>
                    {tier.tier === 'trusted' ? (
                        <p className="mt-3 text-sm text-dark-300">You can choose, per event, to fund in advance or to pay present ushers after the event. Keep pay-after events paid within 7 days of the event to stay trusted.</p>
                    ) : (
                        <p className="mt-3 text-sm text-dark-300">You fund each event&apos;s usher pay before confirming the team. After {tier.requiredPaidEvents} fully paid events with a clean record you can also pay after events.</p>
                    )}
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-dark-400"><span>Fully paid events</span><span>{Math.min(tier.paidEventsCount, tier.requiredPaidEvents)}/{tier.requiredPaidEvents}</span></div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-dark-800">
                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, (tier.paidEventsCount / tier.requiredPaidEvents) * 100)}%` }} />
                        </div>
                    </div>
                    {tier.automaticTier === 'standard' && tier.reasons.filter((reason) => reason !== 'not_enough_paid_events').length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-warning-500">
                            {tier.reasons.filter((reason) => reason !== 'not_enough_paid_events').map((reason) => <li key={reason}>• {TIER_REASON_LABELS[reason]}</li>)}
                        </ul>
                    )}
                    {tier.overdueEvents.length > 0 && (
                        <div className="mt-2 text-xs text-dark-400">Overdue: {tier.overdueEvents.map((event, index) => (
                            <span key={event._id}>{index > 0 && ', '}<Link href={`/provider/events/${event._id}`} className="text-primary-500 hover:underline">{event.title}</Link></span>
                        ))}</div>
                    )}
                </Card>
            </div>

            <Card>
                <h2 className="font-bold text-dark-50">Credit history</h2>
                {overview.entries.length === 0 ? (
                    <p className="mt-3 text-sm text-dark-500">No credit activity yet.</p>
                ) : (
                    <ul className="mt-3 divide-y divide-dark-700/60">
                        {overview.entries.map((entry) => (
                            <li key={entry._id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                                <div className="flex items-start gap-2">
                                    {entry.amount > 0 ? <ArrowDownLeft size={16} className="mt-0.5 text-success-500" /> : <ArrowUpRight size={16} className="mt-0.5 text-dark-400" />}
                                    <div>
                                        <p className="text-dark-200">{CREDIT_ENTRY_LABELS[entry.type] || entry.type}</p>
                                        <p className="text-xs text-dark-500">
                                            {formatDateTime(entry.createdAt)}
                                            {entry.eventId && entry.eventTitle && <> · <Link href={`/provider/events/${entry.eventId}`} className="hover:text-primary-500">{entry.eventTitle}</Link></>}
                                            {entry.note && ` · ${entry.note}`}
                                        </p>
                                    </div>
                                </div>
                                <span className={`shrink-0 font-semibold ${entry.amount > 0 ? 'text-success-500' : 'text-dark-300'}`}>{entry.amount > 0 ? '+' : ''}{egp(entry.amount)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {overview.withdrawals.length > 0 && (
                <Card>
                    <h2 className="font-bold text-dark-50">Withdrawals</h2>
                    <ul className="mt-3 divide-y divide-dark-700/60">
                        {overview.withdrawals.map((withdrawal) => (
                            <li key={withdrawal._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                <div>
                                    <p className="text-dark-200">{egp(withdrawal.amount)}</p>
                                    <p className="text-xs text-dark-500">{formatDateTime(withdrawal.createdAt)}{withdrawal.payoutReference && ` · Ref ${withdrawal.payoutReference}`}{withdrawal.adminNote && ` · ${withdrawal.adminNote}`}</p>
                                </div>
                                <Badge variant={withdrawal.status === 'paid' ? 'success' : withdrawal.status === 'pending' ? 'warning' : 'default'}>{withdrawal.status}</Badge>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
    );
}
