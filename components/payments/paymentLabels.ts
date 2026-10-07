import { CreditEntryType, FundingRefund, SettlementLine, TierReason } from '@/types';

type Tone = 'success' | 'danger' | 'warning' | 'default' | 'info' | 'primary';

export const egp = (amount: number) => `${new Intl.NumberFormat('en-EG', { maximumFractionDigits: 2 }).format(amount)} EGP`;

export const formatDateTime = (value: string | null | undefined) => (value
    ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '');

export const CREDIT_ENTRY_LABELS: Record<CreditEntryType, string> = {
    event_surplus: 'Unused event funding',
    no_show_refund: 'No-show wages returned',
    cancellation_refund: 'Cancellation refund',
    late_funding_refund: 'Payment after the event no longer needed it',
    card_refund_failed: 'Card refund kept as credit',
    funding_applied: 'Used to fund an event',
    chargeback: 'Card refund of used funding',
    admin_adjustment: 'Adjustment by OO-Ushers',
};

export const TIER_REASON_LABELS: Record<TierReason, string> = {
    not_enough_paid_events: 'Fewer than the required fully paid events',
    overdue_payment: 'A pay-after event is unpaid 7+ days after it ended',
    negative_credit_balance: 'The credit balance is negative',
};

export const lineStatus = (line: SettlementLine): { label: string; tone: Tone } => {
    switch (line.payoutStatus) {
        case 'paid': return { label: 'Paid', tone: 'success' };
        case 'failed': return { label: 'Payout error', tone: 'danger' };
        case 'awaiting_method': return { label: 'Needs payout account', tone: 'warning' };
        case 'cash_due': return { label: 'Cash due', tone: 'warning' };
        default: return { label: 'Payout pending', tone: 'warning' };
    }
};

const REFUND_REASONS: Record<FundingRefund['reason'], string> = {
    no_show: 'No-show wages',
    surplus: 'Unused funding',
    cancellation: 'Cancellation refund',
};

export const refundStatus = (refund: FundingRefund): { label: string; tone: Tone; reason: string } => {
    const reason = refund.eventTitle ? `${REFUND_REASONS[refund.reason]} · ${refund.eventTitle}` : REFUND_REASONS[refund.reason];
    switch (refund.status) {
        case 'succeeded': return { label: 'Refunded to card', tone: 'success', reason };
        case 'failed': return { label: 'Added to credit instead', tone: 'default', reason };
        default: return { label: 'Refund in progress', tone: 'warning', reason };
    }
};
