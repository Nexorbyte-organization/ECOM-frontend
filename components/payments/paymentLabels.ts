import { AbsenceHold, CreditEntryType, SettlementLine, TierReason } from '@/types';

type Tone = 'success' | 'danger' | 'warning' | 'default' | 'info' | 'primary';

export const egp = (amount: number) => `${new Intl.NumberFormat('en-EG', { maximumFractionDigits: 2 }).format(amount)} EGP`;

export const formatDateTime = (value: string | null | undefined) => (value
    ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '');

export const CREDIT_ENTRY_LABELS: Record<CreditEntryType, string> = {
    event_surplus: 'Unused event funding',
    absence_release: 'Absent usher pay returned',
    cancellation_refund: 'Cancellation refund',
    late_funding_refund: 'Payment after the event no longer needed it',
    funding_applied: 'Used to fund an event',
    withdrawal: 'Withdrawal requested',
    withdrawal_reversal: 'Withdrawal returned',
    chargeback: 'Card refund of used funding',
    admin_adjustment: 'Adjustment by OO-Ushers',
};

export const TIER_REASON_LABELS: Record<TierReason, string> = {
    not_enough_paid_events: 'Fewer than the required fully paid events',
    overdue_payment: 'A pay-after event is unpaid 7+ days after it ended',
    lost_attendance_dispute: 'An absent mark was overturned for an usher in the last 90 days',
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

export const holdStatus = (hold: AbsenceHold): { label: string; tone: Tone } => {
    switch (hold.status) {
        case 'held': return { label: `Absent · pay held until ${formatDateTime(hold.releaseAfter)}`, tone: 'warning' };
        case 'disputed': return { label: 'Absent · disputed, waiting for review', tone: 'danger' };
        case 'returned_to_organizer': return { label: 'Absent · returned to credit', tone: 'default' };
        default: return { label: 'Paid after review', tone: 'success' };
    }
};
