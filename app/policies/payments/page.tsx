import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Payments & Fees | OO-Ushers' };

export default function PaymentsPolicyPage() {
    return <LegalPage path="/policies/payments" title="Payments & Fees"
        intro="How organizations pay ushers through OO-Ushers, what the platform fee is, and how payouts work. Payments are processed by Paymob."
        sections={[
            { title: 'Platform fee', points: [
                'OO-Ushers charges a 5% fee on each usher’s event pay.',
                'Example: for pay of 1,000 EGP, the fee is 50 EGP and the usher receives 950 EGP.',
            ] },
            { title: 'When payment happens', points: [
                'An organization can pay once the event is completed and at least one hired usher has attendance recorded as present or late.',
                'Only ushers recorded as present or late are included.',
                'The organization can pay all ushers in one checkout, or pay ushers one by one. Once one-by-one payment starts for an event, the single checkout is no longer available. While a single checkout is in progress or paid, ushers cannot be paid one by one; if it fails, the organization can switch to paying one by one.',
            ] },
            { title: 'Digital and cash payouts', points: [
                'Ushers with a supported wallet or bank account are paid automatically after the organization’s payment is confirmed. The organization pays the full amount, and the usher receives 95%.',
                'Ushers without a supported account, or chosen by the organization for cash payment, are paid in cash by the organization. In that case the organization pays only the 5% fee through OO-Ushers and pays the usher’s 95% directly, then records the cash payment.',
                'An usher’s default payment method is used. If there is no default, the first one is used.',
            ] },
            { title: 'Checkouts', points: [
                'Amounts are always calculated by OO-Ushers, not by the browser.',
                'Payment is confirmed only by Paymob’s signed confirmation, never by the page you return to after paying.',
                'An unfinished checkout stays reserved until it expires. After it expires, OO-Ushers checks with Paymob and releases it if no payment was made, so you can start again. This can take up to 24 hours.',
                'An event or usher that has already been paid cannot be charged again.',
            ] },
            { title: 'Failed payouts', points: [
                'If a payout to an usher fails, it is shown beside the usher’s name.',
                'The organization can retry a payout only after Paymob confirms that it failed. A payout with an unknown result is checked before it can be retried, so an usher is never paid twice.',
            ] },
            { title: 'Saved cards', points: [
                'Organizations can save a card through Paymob for future checkouts. OO-Ushers stores only an encrypted card token and the masked card number, never the full card number.',
                'Removing a card stops it from being used. If it was the default, the newest remaining card becomes the default.',
            ] },
            { title: 'Current status', body: 'Payments currently run in Paymob test mode while OO-Ushers completes its merchant setup. Test payments do not move real money. This policy will be updated when live payments start.' },
        ]} />;
}
