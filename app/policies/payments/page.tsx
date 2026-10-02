import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Payments & Fees | OO-Ushers' };

export default function PaymentsPolicyPage() {
    return <LegalPage path="/policies/payments" title="Payments & Fees"
        intro="How organizations pay ushers through OO-Ushers, what the platform fee is, and what happens when plans change. Payments are processed by Paymob."
        sections={[
            { title: 'Platform fee', points: [
                'OO-Ushers charges a 5% fee on each usher’s event pay.',
                'Example: for pay of 1,000 EGP, the fee is 50 EGP and the usher receives 950 EGP.',
                'Pay must be at least 600 EGP per usher for each event day.',
            ] },
            { title: 'Paying in advance', points: [
                'Events are paid in advance by default: the organization funds the full pay of every hired usher before the event, by card through Paymob or from its OO-Ushers credit.',
                'The hired team must be fully funded before the organization can close an event for applications.',
                'The funding deadline is 48 hours before the event starts. From then until the start, hired ushers whose pay is not funded have their booking cancelled automatically, latest hires first, and both sides are notified. New hires after the deadline need their pay funded first.',
                'Ushers can see on the event page whether their pay is secured.',
            ] },
            { title: 'Release of pay', points: [
                'Pay is released automatically 24 hours after the event ends. The organization can release it earlier once the event is completed and check-in has closed.',
                'Ushers who checked in (on time or late) receive 95% of their pay. Ushers without a supported payout account are paid once they add one.',
                'For a booked usher who did not check in, the 95% wage is returned to the organization and OO-Ushers keeps the 5% fee.',
                'Pay can be released only once.',
            ] },
            { title: 'Cancellations', body: 'If an administrator cancels a funded event before pay is released, the funding is split by how long before the start the event was cancelled:', points: [
                '3 days or more before the start: 100% is returned to the organization.',
                'Between 1 and 3 days: 50% is returned, and each hired usher receives 50% of their pay as compensation.',
                'Less than 1 day, or after the start: nothing is returned, and each hired usher receives their full pay as compensation.',
            ] },
            { title: 'Refunds and credit', points: [
                'Money returned to an organization goes back the way it was paid: card payments are refunded to the same card, and amounts paid from credit return to credit.',
                'If a card refund fails, or a payment arrives after the event was cancelled or paid out, the amount becomes OO-Ushers credit.',
                'Credit can only be used to fund future events. It cannot be withdrawn as cash.',
            ] },
            { title: 'Paying after the event', points: [
                'Trusted organizations can choose to pay after an event instead of in advance. An organization becomes trusted after at least 3 paid events, as long as no usher who attended one of its pay-after events has been left unpaid for 7 days and its credit balance is not negative. OO-Ushers can also grant or remove trusted status.',
                'After the event is completed, the organization pays for ushers who checked in, in one checkout or one by one.',
                'Ushers without a supported account, or chosen for cash payment, are paid in cash by the organization. The organization then pays only the 5% fee through OO-Ushers and records the cash payment.',
                'An unfinished checkout stays reserved until it expires. After it expires, OO-Ushers checks with Paymob and releases it if no payment was made. This can take up to 24 hours.',
            ] },
            { title: 'Payouts to ushers', points: [
                'Payouts go to the usher’s default payment method, or the first one if none is set as default.',
                'If a payout fails, it is shown beside the usher’s name. A payout is retried only after Paymob confirms that it failed, so an usher is never paid twice.',
            ] },
            { title: 'Security', points: [
                'Amounts are always calculated by OO-Ushers, not by the browser, and a payment counts only after Paymob’s signed confirmation.',
                'Saved cards are stored only as an encrypted Paymob token and a masked card number, never the full card number.',
            ] },
            { title: 'Current status', body: 'Payments currently run in Paymob test mode while OO-Ushers completes its merchant setup. Test payments do not move real money. This policy will be updated when live payments start.' },
        ]} />;
}
