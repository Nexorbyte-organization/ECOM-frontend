import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Usher Policy | OO-Ushers' };

export default function UsherPolicyPage() {
    return <LegalPage path="/policies/ushers" title="Usher Policy"
        intro="How applying, booking, attendance, excuses, ratings, and pay work for ushers on OO-Ushers."
        sections={[
            { title: 'Complete profile', body: 'Before you can apply, accept invitations, accept referrals, or excuse yourself, your profile must include your full name, an uploaded profile photo, city, mobile number, education, work cities, languages, event categories, and at least one payment method.' },
            { title: 'Applying to events', points: [
                'You can apply to an open event before its application deadline. You can apply only once per event.',
                'Some organizations accept highly rated ushers automatically: if your rating is above 4.5 and the organization has turned this on, your application may be accepted immediately when there is a free place.',
                'You cannot be accepted for two events on the same day.',
            ] },
            { title: 'Booking invitations', points: [
                'An organization may invite you directly to an event. You are only booked after you accept.',
                'You can accept or decline from the event page. The organization cannot accept on your behalf, but it can withdraw an invitation you have not answered.',
                'Invitations can no longer be answered once the event has started, been cancelled, or been completed.',
            ] },
            { title: 'Excusing yourself', points: [
                'You can excuse yourself from an accepted event until the event starts.',
                'An excuse made within 3 days of the application deadline, or after it, counts as a late excuse.',
                'Five consecutive events attended on time or late (not absent) reset your late-excuse count. An absence resets that streak.',
                'If you reach 5 late excuses, you cannot apply, accept referrals, or accept invitations until an administrator reviews your account.',
            ] },
            { title: 'Event-day check-in', points: [
                'Check in by scanning the organization’s attendance QR code at the venue.',
                'Check-in opens 2 hours before the event starts and closes 2 hours after it ends. Event times follow Egypt time.',
                'Arriving more than 15 minutes after the start time is recorded as late.',
                'Scanning again does not change your first check-in. The organization can also record attendance manually as present, late, or absent.',
                'Do not share the QR code or check in for anyone else.',
            ] },
            { title: 'Ratings and verification', points: [
                'Organizations can rate you from 1 to 5 stars after an event ends, but only if you attended.',
                'Your reliability score is the share of your recorded events where you attended.',
                'You are verified automatically after 10 attended events with a rating of at least 4. Administrators may also verify or unverify accounts.',
            ] },
            { title: 'Referrals', points: [
                'Verified ushers who are accepted for an event can refer other ushers to it, directly or with an invite link that lasts 7 days.',
                'A referral only becomes an application when the referred usher accepts it, and it can still be accepted automatically under the rules above.',
            ] },
            { title: 'Pay', points: [
                'Pay is the per-usher amount shown on the event. You are paid for events where your attendance was recorded as present or late.',
                'OO-Ushers keeps a 5% platform fee, so you receive 95% of the event pay.',
                'Payment to you happens after the organization marks the event completed and pays. See Payments & Fees for how payouts and cash payments work.',
            ] },
            { title: 'Your information', body: 'Organizations you apply to can see your profile and contact details so they can reach you about their event. Payout account numbers are only shown to organizations masked to the last 4 digits. Other ushers only see your public profile. See the Privacy Policy for details.' },
        ]} />;
}
