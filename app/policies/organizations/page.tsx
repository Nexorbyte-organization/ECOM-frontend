import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Organization Policy | OO-Ushers' };

export default function OrganizationPolicyPage() {
    return <LegalPage path="/policies/organizations" title="Organization Policy"
        intro="How events, hiring, check-in, ratings, and changes work for organizations on OO-Ushers."
        sections={[
            { title: 'Organization accounts and staff', points: [
                'The organization owner must complete the company profile (name, uploaded logo, description, location, and phone) before creating events, booking ushers, or managing staff.',
                'Owners can add members and supervisors. Staff can review applicants, accept or decline them, manage standby, send booking invitations, run check-in, and rate ushers.',
                'Only the owner can create, edit, close, and complete events, manage the event map, fund events, release payments, and manage saved cards.',
            ] },
            { title: 'Event status', points: [
                'Every event is open, confirmed, completed, or cancelled.',
                'Open: accepting applications. Closing an open event makes it confirmed. For events paid in advance, the hired team must be fully funded before you can close it.',
                'Completed: you can mark an event completed once it has ended. Events are also completed automatically 24 hours after they end.',
                'Organizations cannot cancel or delete events. Contact OO-Ushers support, and an administrator will cancel it. Cancelled is final.',
                'When an event is completed or cancelled, applications and standby places still waiting are declined, and pending referrals are closed. When an event is cancelled, hired ushers and pending applicants are notified.',
            ] },
            { title: 'Editing events', points: [
                'Open events can be fully edited, except that pay cannot be lowered once ushers are hired.',
                'Confirmed events: you can still change the title, date, times, location, meeting point, venue pin, dress code, notes, WhatsApp link, and standby size. Staffing numbers, category, deadline, and pay are locked.',
                'After the event starts, only notes and the WhatsApp link can change. Completed and cancelled events cannot be edited.',
                'Moving the date is refused if any hired usher is already booked for another event on the new date.',
                'Hired ushers are notified when the date, start or end time, location, meeting point, pay, or dress code changes.',
                'Pay must be at least 600 EGP per usher for each event day.',
            ] },
            { title: 'Hiring ushers', points: [
                'You can accept or decline applications until the event starts.',
                'An usher cannot be accepted beyond the number of ushers needed, if they are already hired for another event that day, or while they are blocked or suspended for no-shows.',
                'For events paid in advance, after the funding deadline (48 hours before the start) you can only hire ushers whose pay is already funded.',
                'Booking invitations are offers: the usher must accept them. You can withdraw an invitation the usher has not answered.',
                'You can keep a favorite ushers list and invite your previous event’s team to a new event in one step. Favorites do not reserve or book anyone.',
                'If you turn on automatic acceptance, ushers rated above 4.5 are accepted automatically while places are free.',
            ] },
            { title: 'Standby', points: [
                'You can keep a standby list of up to half the number of ushers needed. Standby is unpaid and only includes ushers who agreed to it.',
                'If a hired place opens before the start, standby ushers move into the team automatically in the order they joined, and you are notified.',
                'The standby list is released when the event starts.',
            ] },
            { title: 'Check-in', points: [
                'Your staff open the check-in screen on their phones with location turned on. It shows a QR code and a 6-digit code that change every 30 seconds. You can run several check-in points at once.',
                'Ushers check in with their own phones within 200 meters of a staff phone or the venue, from 2 hours before the start until 2 hours after the end.',
                'Staff can check in an usher whose phone cannot, as present or late. Nobody can mark an usher absent: ushers who do not check in are recorded absent automatically when check-in closes.',
                'Check-in is the record used for pay. Ushers who did not check in are not paid.',
            ] },
            { title: 'Ratings', points: [
                'You can rate an usher once per event, after the event ends, and only if they attended. A written comment is optional.',
                'Your first two ratings of an usher count fully; later ones count less. Ratings must be honest and based on the usher’s work.',
            ] },
            { title: 'Your responsibilities', points: [
                'Give accurate event details, pay, times, and working conditions.',
                'Provide a safe and lawful workplace and treat ushers with respect.',
                'Use ushers’ contact details only to coordinate the event you hired them for. You see them only after an usher is booked.',
                'Fund and pay ushers as described in Payments & Fees.',
            ] },
        ]} />;
}
