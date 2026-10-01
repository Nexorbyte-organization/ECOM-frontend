'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Landmark, Scale, ShieldCheck, Wallet } from 'lucide-react';
import ContentSkeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Avatar from '@/components/ui/Avatar';
import {
    adjustOrganizerCredit, getAdminOrganizerPayments, getAdminPaymentsOverview, resolveAbsenceHold,
    resolveCreditWithdrawal, setOrganizerPaymentTier,
} from '@/lib/api';
import { AdminPaymentsOverview, OrganizerCreditOverview } from '@/types';
import { CREDIT_ENTRY_LABELS, TIER_REASON_LABELS, egp, formatDateTime } from '@/components/payments/paymentLabels';

function OrganizationPayments({ organizerId }: { organizerId: string }) {
    const router = useRouter();
    const [data, setData] = useState<OrganizerCreditOverview | null>(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const load = useCallback(async () => {
        try {
            setData(await getAdminOrganizerPayments(organizerId));
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load the organization.');
        }
    }, [organizerId]);
    useEffect(() => { void load(); }, [load]);

    const run = async (key: string, action: () => Promise<void>) => {
        setBusy(key);
        setError('');
        try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); } finally { setBusy(null); }
    };

    if (!data) return error ? <Card><p role="alert" className="text-sm text-danger-400">{error}</p></Card> : <ContentSkeleton variant="detail" />;
    const parsed = Number(amount);
    const adjustmentValid = Number.isFinite(parsed) && parsed !== 0 && note.trim().length > 0
        && Math.abs(parsed * 100 - Math.round(parsed * 100)) < 1e-6;

    return (
        <div className="space-y-4">
            <button onClick={() => router.push('/admin/payments')} className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200"><ArrowLeft size={16} /> All payments</button>
            <h2 className="text-xl font-black text-dark-50">{data.organization?.fullName || 'Organization'}</h2>
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <div className="flex flex-wrap items-center gap-2"><ShieldCheck size={18} className="text-primary-500" /><h3 className="font-bold text-dark-50">Payment tier</h3>
                        <Badge variant={data.tier.tier === 'trusted' ? 'success' : 'default'}>{data.tier.tier}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-dark-400">Automatic: {data.tier.automaticTier} · {data.tier.paidEventsCount}/{data.tier.requiredPaidEvents} paid events · {data.tier.overdueEventsCount} overdue · {data.tier.lostDisputesCount} lost disputes (90 days)</p>
                    {data.tier.reasons.length > 0 && <ul className="mt-2 space-y-1 text-xs text-dark-400">{data.tier.reasons.map((reason) => <li key={reason}>• {TIER_REASON_LABELS[reason]}</li>)}</ul>}
                    <div className="mt-3">
                        <Select
                            label="Override"
                            value={data.tier.override || 'automatic'}
                            disabled={Boolean(busy)}
                            onChange={(e) => run('tier', async () => {
                                const value = e.target.value;
                                await setOrganizerPaymentTier(organizerId, value === 'automatic' ? null : value as 'trusted' | 'standard');
                                await load();
                            })}
                            options={[
                                { value: 'automatic', label: 'Automatic' },
                                { value: 'trusted', label: 'Always trusted (may pay after events)' },
                                { value: 'standard', label: 'Always standard (must fund in advance)' },
                            ]}
                        />
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-2"><Wallet size={18} className="text-primary-500" /><h3 className="font-bold text-dark-50">Credit</h3></div>
                    <p className={`mt-2 text-2xl font-black ${data.balance < 0 ? 'text-danger-400' : 'text-dark-50'}`}>{egp(data.balance)}</p>
                    <div className="mt-3 space-y-2">
                        <Input type="number" step="0.01" placeholder="Amount (negative to deduct)" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Adjustment amount in EGP" />
                        <Input placeholder="Reason (shown to the organization)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Adjustment reason" />
                        <Button size="sm" isLoading={busy === 'adjust'} disabled={!adjustmentValid || Boolean(busy)}
                            onClick={() => run('adjust', async () => { setData(await adjustOrganizerCredit(organizerId, parsed, note.trim())); setAmount(''); setNote(''); })}>
                            Add adjustment
                        </Button>
                    </div>
                </Card>
            </div>
            <Card>
                <h3 className="font-bold text-dark-50">Credit history</h3>
                {data.entries.length === 0 ? <p className="mt-2 text-sm text-dark-500">No credit activity.</p> : (
                    <ul className="mt-2 divide-y divide-dark-700/60">
                        {data.entries.map((entry) => (
                            <li key={entry._id} className="flex justify-between gap-3 py-2 text-sm">
                                <span className="text-dark-200">{CREDIT_ENTRY_LABELS[entry.type]}<span className="block text-xs text-dark-500">{formatDateTime(entry.createdAt)}{entry.eventTitle && ` · ${entry.eventTitle}`}{entry.note && ` · ${entry.note}`}</span></span>
                                <span className={entry.amount > 0 ? 'font-semibold text-success-500' : 'font-semibold text-dark-300'}>{entry.amount > 0 ? '+' : ''}{egp(entry.amount)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}

function PaymentsOverview() {
    const [overview, setOverview] = useState<AdminPaymentsOverview | null>(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [references, setReferences] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        try {
            setOverview(await getAdminPaymentsOverview());
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load payments.');
        }
    }, []);
    useEffect(() => { void load(); }, [load]);

    const run = async (key: string, action: () => Promise<void>) => {
        setBusy(key);
        setError('');
        try { await action(); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); } finally { setBusy(null); }
    };

    if (!overview) return error ? <Card><p role="alert" className="text-sm text-danger-400">{error}</p></Card> : <ContentSkeleton variant="list" />;

    return (
        <div className="space-y-6">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}

            <section className="space-y-3">
                <div className="flex items-center gap-2"><Scale size={18} className="text-warning-500" /><h2 className="font-bold text-dark-50">Attendance disputes ({overview.disputes.length})</h2></div>
                {overview.disputes.length === 0 ? <Card className="text-sm text-dark-500">No open disputes.</Card> : overview.disputes.map((hold) => (
                    <Card key={hold._id}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <Avatar src={hold.talent?.photo} name={hold.talent?.fullName || 'Usher'} />
                                <div>
                                    <p className="text-sm font-semibold text-dark-100">{hold.talent?.fullName} · {egp(hold.amount)}</p>
                                    <p className="text-xs text-dark-400">{hold.event?.title} · {hold.organization?.fullName} · disputed {formatDateTime(hold.disputedAt)}</p>
                                    <p className="mt-2 rounded-lg bg-dark-900/60 p-2 text-sm text-dark-200">“{hold.disputeReason}”</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                            <Input placeholder="Decision note (sent to both sides)" value={notes[hold._id] || ''} onChange={(e) => setNotes((items) => ({ ...items, [hold._id]: e.target.value }))} aria-label="Decision note" />
                            <Button size="sm" variant="success" isLoading={busy === `${hold._id}:usher`} disabled={Boolean(busy)}
                                onClick={() => run(`${hold._id}:usher`, async () => { await resolveAbsenceHold(hold._id, 'usher', notes[hold._id] || ''); })}>
                                Usher attended — pay them
                            </Button>
                            <Button size="sm" variant="secondary" isLoading={busy === `${hold._id}:organizer`} disabled={Boolean(busy)}
                                onClick={() => run(`${hold._id}:organizer`, async () => { await resolveAbsenceHold(hold._id, 'organizer', notes[hold._id] || ''); })}>
                                Uphold absent mark
                            </Button>
                        </div>
                    </Card>
                ))}
            </section>

            <section className="space-y-3">
                <div className="flex items-center gap-2"><Landmark size={18} className="text-primary-500" /><h2 className="font-bold text-dark-50">Credit withdrawals ({overview.withdrawals.length})</h2></div>
                {overview.withdrawals.length === 0 ? <Card className="text-sm text-dark-500">No pending withdrawals.</Card> : overview.withdrawals.map((withdrawal) => (
                    <Card key={withdrawal._id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-dark-100">{withdrawal.organization?.fullName} · {egp(withdrawal.amount)}</p>
                                <p className="text-xs text-dark-400">Requested {formatDateTime(withdrawal.createdAt)} · {withdrawal.organization?.email}{withdrawal.organization?.mobileNumber && ` · ${withdrawal.organization.mobileNumber}`} · balance after: {egp(withdrawal.remainingBalance || 0)}</p>
                            </div>
                            {withdrawal.organization?._id && <Link href={`/admin/payments?org=${withdrawal.organization._id}`} className="text-xs font-semibold text-primary-500 hover:underline">Organization payments</Link>}
                        </div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                            <Input placeholder="Bank transfer reference" value={references[withdrawal._id] || ''} onChange={(e) => setReferences((items) => ({ ...items, [withdrawal._id]: e.target.value }))} aria-label="Transfer reference" />
                            <Input placeholder="Note (optional)" value={notes[withdrawal._id] || ''} onChange={(e) => setNotes((items) => ({ ...items, [withdrawal._id]: e.target.value }))} aria-label="Withdrawal note" />
                            <Button size="sm" variant="success" isLoading={busy === `${withdrawal._id}:paid`} disabled={Boolean(busy) || !(references[withdrawal._id] || '').trim()}
                                onClick={() => run(`${withdrawal._id}:paid`, () => resolveCreditWithdrawal(withdrawal._id, 'paid', { payoutReference: references[withdrawal._id].trim(), note: notes[withdrawal._id] }))}>
                                Mark transferred
                            </Button>
                            <Button size="sm" variant="secondary" isLoading={busy === `${withdrawal._id}:rejected`} disabled={Boolean(busy)}
                                onClick={() => run(`${withdrawal._id}:rejected`, () => resolveCreditWithdrawal(withdrawal._id, 'rejected', { note: notes[withdrawal._id] }))}>
                                Reject
                            </Button>
                        </div>
                    </Card>
                ))}
            </section>

            <section className="space-y-3">
                <div className="flex items-center gap-2"><AlertTriangle size={18} className="text-danger-400" /><h2 className="font-bold text-dark-50">Events still owing usher pay ({overview.underfunded.length})</h2></div>
                {overview.underfunded.length === 0 ? <Card className="text-sm text-dark-500">Every prefunded event is fully funded.</Card> : (
                    <Card className="p-0">
                        <ul className="divide-y divide-dark-700/60">
                            {overview.underfunded.map((item) => (
                                <li key={item.event._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                                    <div>
                                        <p className="font-semibold text-dark-100">{item.event.title}</p>
                                        <p className="text-xs text-dark-400">{item.organization.fullName} · {item.event.status} · due by {formatDateTime(item.deadline)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-dark-300">{egp(item.fundedAmount)} / {egp(item.requiredAmount)}</span>
                                        <Badge variant={item.overdue ? 'danger' : 'warning'}>{item.overdue ? 'Overdue' : 'Due'} {egp(item.shortfallAmount)}</Badge>
                                        <Link href={`/admin/payments?org=${item.organization._id}`} className="text-xs font-semibold text-primary-500 hover:underline">Organization</Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </section>
        </div>
    );
}

function AdminPaymentsContent() {
    const organizerId = useSearchParams().get('org');
    return (
        <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-dark-50">Payments</h1>
                <p className="mt-1 text-sm text-dark-400">Attendance disputes, credit withdrawals, event funding, and organization payment tiers.</p>
            </div>
            {organizerId ? <OrganizationPayments organizerId={organizerId} /> : <PaymentsOverview />}
        </div>
    );
}

export default function AdminPaymentsPage() {
    return <Suspense fallback={<ContentSkeleton variant="list" className="mx-auto max-w-5xl" />}><AdminPaymentsContent /></Suspense>;
}
