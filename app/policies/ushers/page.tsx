import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Usher Policy | OO-Ushers' };

export default function UsherPolicyPage() {
    return <LegalPage path="/policies/ushers" title="Usher Policy"
        intro="How applying, booking, standby, check-in, excuses, ratings, and pay work for ushers on OO-Ushers."
        sections={[
            { title: 'Complete profile', body: 'Before you can apply, accept invitations, accept referrals, or excuse yourself, your profile must include your full name, an uploaded profile photo, city, mobile number, education, work cities, languages, event categories, and at least one payment method.' },
            { title: 'Applying to events', points: [
                'You can apply to an open event before its application deadline. You can apply only once per event.',
                'Some organizations accept highly rated ushers automatically: if your rating is above 4.5 and the organization has turned this on, your application may be accepted immediately when there is a free place.',
                'You cannot be hired for two events on the same day.',
            ] },
            { title: 'Booking invitations', points: [
                'An organization may invite you directly to an event, for example to rebook its previous team. You are only booked after you accept.',
                'You can accept or decline from the event page. The organization cannot accept on your behalf, but it can withdraw an invitation you have not answered.',
                'Invitations can no longer be answered once the event has started, been cancelled, or been completed.',
            ] },
            { title: 'Standby', points: [
                'Standby is an unpaid, on-call place on an event’s list. You only join it if you agree, either when you apply or by accepting a standby invitation.',
                'If a hired place opens before the event starts, standby ushers move into the team in the order they joined, and you are notified. Once you are moved in, you are a hired usher and are paid like one.',
                'You can leave a standby list at any time without penalty. When you are hired for another event that day, your standby places for that day are withdrawn.',
                'Standby ushers do not see the WhatsApp group or event map, and the list is released when the event starts.',
            ] },
            { title: 'Excusing yourself', points: [
                'You can excuse yourself from an accepted event until the event starts.',
                'An excuse made within 3 days of the application deadline, or after it, counts as a late excuse. An excuse within 2 hours of being moved in from standby is not late.',
                'Five consecutive events where you checked in (on time or late) reset your late-excuse count. A no-show resets that streak.',
                'If you reach 5 late excuses, you cannot apply, accept referrals, or accept invitations until an administrator reviews your account.',
            ] },
            { title: 'Event-day check-in', points: [
                'You check in yourself with your phone, using your location: scan the QR code on a staff member’s phone, type the 6-digit code they show you, or tap “I’m here” at the venue.',
                'You must be within 200 meters of the staff member’s phone or the venue. Codes change every 30 seconds, so a photo of the code does not work later.',
                'Check-in opens 2 hours before the event starts and closes 2 hours after it ends. Event times follow Egypt time. Arriving more than 15 minutes after the start time is recorded as late.',
                'If your phone cannot check in, organization staff can check you in as present or late. Nobody can mark you absent by hand.',
                'If you do not check in by the time check-in closes, you are recorded as absent automatically.',
            ] },
            { title: 'No-shows', points: [
                'Three no-shows within 90 days suspend your account for 30 days after the latest one. While suspended you cannot apply, accept invitations, or be booked. The suspension lifts on its own.',
                'If staff later check you in for an event you were recorded absent for, the absence and any suspension it caused are recalculated.',
            ] },
            { title: 'Ratings and verification', points: [
                'Organizations can rate you from 1 to 5 stars after an event ends, but only if you attended. A written comment is optional.',
                'Each organization’s first two ratings of you count fully; later ratings from the same organization count less, so no single organization can make or break your rating.',
                'Your reliability score is the share of your recorded events where you attended.',
                'You are verified automatically after 10 attended events with at least 3 different organizations and a rating of at least 4. Administrators may also verify or unverify accounts.',
            ] },
            { title: 'Referrals', points: [
                'Verified ushers who are accepted for an event can refer other ushers to it, directly or with an invite link that lasts 7 days.',
                'A referral only becomes an application when the referred usher accepts it.',
            ] },
            { title: 'Pay', points: [
                'Pay is the per-usher amount shown on the event, at least 600 EGP for each event day. OO-Ushers keeps a 5% platform fee, so you receive 95%.',
                'For most events the organization pays your wage in advance. The event page shows whether your pay is secured.',
                'You are paid for events where you checked in (on time or late). Pay is released automatically 24 hours after the event ends, or earlier if the organization releases it.',
                'If an event you were hired for is cancelled less than 3 days before it starts, you may receive compensation. See Payments & Fees.',
                'If you have no supported payout account when pay is released, it waits until you add one.',
            ] },
            { title: 'Your information', body: 'Organizations see your profile, with payout accounts masked to the last 4 digits. They see your phone number and email only once you are booked for their event. Other ushers see only your public profile. See the Privacy Policy for details.' },
        ]} />;
}
