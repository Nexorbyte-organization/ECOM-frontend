'use client';

import ContentSkeleton from '@/components/ui/Skeleton';
import { toast } from '@/lib/toast';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, XCircle } from 'lucide-react';
import { getFundingCheckout, getSettlement } from '@/lib/api';
import { EventFundingSummary, EventSettlement, EventFundingCheckout } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type FundingResult = EventFundingCheckout & { event: { _id: string; title: string } | null; eventFunding: EventFundingSummary | null };

// Result of an advance-funding checkout. The Paymob callback decides the outcome; this page
// only polls the backend for it.
function FundingResultContent({ fundingId }: { fundingId: string }) {
    const router = useRouter();
    const [funding, setFunding] = useState<FundingResult | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        try {
            setFunding(await getFundingCheckout(fundingId));
            setError('');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Could not read payment status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        let checks = 0;
        const check = async () => {
            if (!active) return;
            await refresh();
            checks += 1;
            if (active && checks < 6) window.setTimeout(check, 2500);
        };
        void check();
        return () => { active = false; };
        // The funding id is the only value that starts a new polling sequence.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fundingId]);

    // A card hold is confirmed once it is authorized; it is charged after the event day.
    const paid = funding?.collectionStatus === 'paid' || funding?.collectionStatus === 'authorized';
    const failed = funding?.collectionStatus === 'failed' || funding?.collectionStatus === 'refunded';
    const eventId = funding?.eventId;

    useEffect(() => {
        if (!paid || !eventId) return;
        toast.success({ en: 'Funding confirmed.', ar: 'تم تأكيد التمويل.', 'ar-eg': 'التمويل اتأكد.' });
        const timeout = window.setTimeout(() => router.replace(`/provider/events/${eventId}`), 3000);
        return () => window.clearTimeout(timeout);
    }, [paid, eventId, router]);

    if (loading) return <ContentSkeleton variant="status" className="mx-auto max-w-2xl" />;
    const summary = funding?.eventFunding;

    return (
        <div className="mx-auto max-w-2xl space-y-5 py-8 animate-fade-in">
            <Card className="text-center">
                {paid ? <CheckCircle2 size={48} className="mx-auto mb-4 text-success-500" />
                    : failed ? <XCircle size={48} className="mx-auto mb-4 text-danger-500" />
                        : <Clock3 size={48} className="mx-auto mb-4 text-warning-500" />}
                <Badge variant="warning">PAYMOB TEST MODE</Badge>
                <h1 className="mt-3 text-2xl font-black text-dark-50">
                    {paid ? 'Event funding confirmed' : failed ? 'Funding payment was not completed' : 'Funding confirmation pending'}
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-sm text-dark-400">
                    {paid
                        ? funding?.kind === 'day_hold'
                            ? `Paymob placed a ${funding?.amount} EGP hold on your card for “${funding?.event?.title || 'your event'}”. You are only charged for ushers who check in, after the day. Returning to your event…`
                            : funding?.kind === 'fee'
                                ? `Paymob confirmed the ${funding?.amount} EGP booking fee for “${funding?.event?.title || 'your event'}”. Returning to your event…`
                                : `Paymob confirmed ${funding?.amount} EGP for “${funding?.event?.title || 'your event'}”. OO-Ushers holds it until you release the usher payments. Returning to your event…`
                        : failed
                            ? funding?.collectionFailureReason || 'Try again from the event funding panel. Any credit you applied stays on the event.'
                            : 'The Paymob callback can take a few seconds. This page refreshes the status automatically.'}
                </p>
            </Card>
            {summary && 'requiredAmount' in summary && (
                <Card>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-xs text-dark-400">Required for the team</p><p className="font-bold text-dark-50">{summary.requiredAmount} EGP</p></div>
                        <div><p className="text-xs text-dark-400">Funded</p><p className="font-bold text-success-500">{summary.fundedAmount} EGP</p></div>
                        <div><p className="text-xs text-dark-400">Still due</p><p className="font-bold text-warning-500">{summary.shortfallAmount} EGP</p></div>
                        <div><p className="text-xs text-dark-400">This payment</p><p className="capitalize font-bold text-dark-50">{funding?.collectionStatus}</p></div>
                    </div>
                </Card>
            )}
            {error && <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-500">{error}</div>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                <Button variant="secondary" onClick={() => { setLoading(true); void refresh(); }} icon={<RefreshCw size={15} />}>Refresh status</Button>
                {eventId && <Link href={`/provider/events/${eventId}`}><Button className="w-full">Back to event</Button></Link>}
            </div>
        </div>
    );
}

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const fundingId = searchParams.get('fundingId');
    return fundingId ? <FundingResultContent fundingId={fundingId} /> : <SettlementResultContent />;
}

function SettlementResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const settlementId = searchParams.get('settlementId');
    const [settlement, setSettlement] = useState<EventSettlement | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        if (!settlementId) {
            setError('The settlement reference is missing.');
            setLoading(false);
            return;
        }
        try {
            setSettlement(await getSettlement(settlementId));
            setError('');
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Could not read payment status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        let checks = 0;
        const check = async () => {
            if (!active) return;
            await refresh();
            checks += 1;
            if (active && checks < 6) window.setTimeout(check, 2500);
        };
        void check();
        return () => { active = false; };
        // The settlement id is the only value that starts a new polling sequence.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settlementId]);

    const status = settlement?.collectionStatus;
    const paid = status === 'paid';
    const failed = status === 'failed' || status === 'refunded';

    useEffect(() => {
        if (!paid || !settlement?.eventId) return;
        toast.success({ en: 'Payment confirmed.', ar: 'تم تأكيد الدفع.', 'ar-eg': 'الدفع اتأكد.' });
        const timeout = window.setTimeout(() => {
            router.replace(`/provider/events/${settlement.eventId}`);
        }, 3000);
        return () => window.clearTimeout(timeout);
    }, [paid, settlement?.eventId, router]);

    if (loading) return <ContentSkeleton variant="status" className="mx-auto max-w-2xl" />;

    return (
        <div className="mx-auto max-w-2xl space-y-5 py-8 animate-fade-in">
            <Card className="text-center">
                {paid ? (
                    <CheckCircle2 size={48} className="mx-auto mb-4 text-success-500" />
                ) : failed ? (
                    <XCircle size={48} className="mx-auto mb-4 text-danger-500" />
                ) : (
                    <Clock3 size={48} className="mx-auto mb-4 text-warning-500" />
                )}
                <Badge variant="warning">PAYMOB TEST MODE</Badge>
                <h1 className="mt-3 text-2xl font-black text-dark-50">
                    {paid ? 'Payment confirmed' : failed ? 'Payment was not completed' : 'Payment confirmation pending'}
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-sm text-dark-400">
                    {paid
                        ? 'Paymob confirmed the organization payment. Returning to your event in a moment…'
                        : failed
                        ? settlement?.collectionFailureReason || 'Try the test checkout again from the event payment panel.'
                        : 'The Paymob callback can take a few seconds. This page refreshes the status automatically.'}
                </p>
            </Card>

            {settlement && (
                <Card>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-xs text-dark-400">Paymob charge</p><p className="font-bold text-dark-50">{settlement.collectionAmount} EGP</p></div>
                        <div><p className="text-xs text-dark-400">Cash still due</p><p className="font-bold text-warning-500">{settlement.cashDueAmount} EGP</p></div>
                        <div><p className="text-xs text-dark-400">Collection</p><p className="capitalize font-bold text-dark-50">{settlement.collectionStatus}</p></div>
                        <div><p className="text-xs text-dark-400">Payouts</p><p className="capitalize font-bold text-dark-50">{settlement.payoutStatus.replace('_', ' ')}</p></div>
                    </div>
                    {!settlement.payoutSandboxConfigured && paid && (
                        <div className="mt-4 flex gap-2 rounded-xl border border-warning-500/30 bg-warning-500/10 p-3 text-xs text-warning-500">
                            <AlertTriangle size={16} className="shrink-0" />
                            Payout sandbox credentials are not connected yet, so digital payouts are queued safely.
                        </div>
                    )}
                </Card>
            )}

            {error && <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-500">{error}</div>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                <Button variant="secondary" onClick={() => { setLoading(true); void refresh(); }} icon={<RefreshCw size={15} />}>Refresh status</Button>
                {settlement?.eventId && <Link href={`/provider/events/${settlement.eventId}`}><Button className="w-full">Back to event payments</Button></Link>}
            </div>
        </div>
    );
}

export default function PaymentResultPage() {
    return <Suspense fallback={<ContentSkeleton variant="status" className="mx-auto max-w-2xl" />}><PaymentResultContent /></Suspense>;
}
