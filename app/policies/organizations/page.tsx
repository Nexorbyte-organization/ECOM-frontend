import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Organization Policy | OO-Ushers' };

export default function OrganizationPolicyPage() {
    return <LegalPage path="/policies/organizations" title="Organization Policy"
        intro="How events, hiring, attendance, ratings, and changes work for organizations on OO-Ushers."
        sections={[
            { title: 'Organization accounts and staff', points: [
                'The organization owner must complete the company profile (name, uploaded logo, description, location, and phone) before creating events, booking ushers, or managing staff.',
                'Owners can add members and supervisors. Staff can review applicants, book ushers, record attendance, and rate ushers. Only the owner can create, edit, close, complete, cancel, or delete events, manage the event map and attendance QR, and handle payments and saved cards.',
            ] },
            { title: 'Event status', points: [
                'Every event is open, confirmed, completed, or cancelled.',
                'Open: accepting applications. Closing an open event makes it confirmed.',
                'Completed: the owner can mark an event completed once it has ended. Completion unlocks payment to ushers.',
                'Cancelled is final and cannot be reversed.',
                'You can cancel or delete an open event directly. A confirmed or completed event needs an administrator to approve a cancellation or deletion request.',
            ] },
            { title: 'What happens when an event ends or is cancelled', points: [
                'When an event is completed or cancelled, applications still waiting for a decision are declined and pending referrals are closed.',
                'When an event is cancelled, the hired ushers and pending applicants are notified.',
                'A completed event cannot be reopened once payment has started.',
            ] },
            { title: 'Editing events', points: [
                'Completed and cancelled events cannot be edited.',
                'You cannot lower the number of ushers needed below the number already hired.',
                'Moving the date is refused if any hired usher is already booked for another event on the new date.',
                'Hired ushers are notified when the date, start or end time, location, meeting point, pay, or dress code changes.',
            ] },
            { title: 'Hiring ushers', points: [
                'You can accept or decline applications until the event starts. After that, record attendance instead.',
                'An usher cannot be accepted beyond the number of ushers needed, or if they are already hired for another event that day.',
                'Excused applications cannot be changed back, and blocked ushers cannot be accepted.',
                'Booking invitations are offers: the usher must accept them. You can withdraw an invitation the usher has not answered.',
                'If you turn on automatic acceptance, ushers rated above 4.5 are accepted automatically while places are free.',
            ] },
            { title: 'Attendance and ratings', points: [
                'The attendance QR code is created once per event while it is open. Ushers can only use it from 2 hours before the start until 2 hours after the end.',
                'Attendance can be recorded manually from the same time.',
                'You can rate an usher once per event, after the event ends, and only if they attended. Ratings must be honest and based on the usher’s work.',
            ] },
            { title: 'Your responsibilities', points: [
                'Give accurate event details, pay, times, and working conditions.',
                'Provide a safe and lawful workplace and treat ushers with respect.',
                'Use ushers’ contact details only to coordinate the event you hired them for.',
                'Pay ushers as described in Payments & Fees.',
            ] },
        ]} />;
}
