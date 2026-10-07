import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy | OO-Ushers' };

export default function PrivacyPage() {
    return <LegalPage path="/privacy" title="Privacy Policy"
        intro="This policy explains what information OO-Ushers collects, who can see it, and how long it is kept."
        sections={[
            { title: 'Information we collect', points: [
                'Account details: email, password (stored only as a secure hash), role, and email-verification status.',
                'Usher profiles: name, photo, portfolio images, city, mobile and WhatsApp numbers, education, work cities, languages, event categories, availability, and payout accounts (wallet or bank details).',
                'Organization profiles: company name, logo, description, location, phone, and website, plus staff accounts.',
                'Activity: events, applications, booking invitations, standby places, referrals, excuses, attendance, ratings and reviews, favorites, notifications, payments, refunds, and organization credit.',
                'Location at check-in: when an usher checks in, we record the method used and the phone’s location at that moment. While organization staff run the check-in screen, their phone’s location is shared every few seconds. We do not track location at any other time.',
                'Security records: sign-in sessions and server logs used to protect accounts and investigate misuse.',
            ] },
            { title: 'How we use it', points: [
                'To run your account and keep it secure, including one active session per account.',
                'To match ushers with events, handle applications, invitations, and standby, verify attendance, and calculate ratings, reliability, verification, and no-show suspensions.',
                'To process payments and payouts and keep payment records.',
                'To send notifications and service emails about your events, account, and payments, including a reminder email in the 24 hours before an event you are hired for.',
            ] },
            { title: 'Who can see your information', points: [
                'Other ushers see only your public profile: no phone numbers, email, or payout accounts.',
                'Organizations you apply to, or that invite you, can see your profile, with payout account numbers masked to the last 4 digits. They see your phone number and email only once you are booked for their event.',
                'Hired ushers can see an event’s WhatsApp group link and only their own position on the event map.',
                'Administrators can see account records to provide support and keep the platform safe. An administrator may temporarily act inside an organization’s workspace to help it, and these actions are logged.',
                'We do not sell your information.',
            ] },
            { title: 'Service providers', points: [
                'Paymob processes payments and payouts. We store only an encrypted card token and the masked card number for saved cards.',
                'Cloudinary stores uploaded images.',
                'Our hosting, database, and email providers process data so the service can run.',
            ] },
            { title: 'Retention', points: [
                'When you clear notifications or remove items such as saved cards, they disappear from the service but are kept in our records.',
                'When an account or event is deleted, it is removed from the service, but its records are kept for support, disputes, payment reconciliation, and legal requirements.',
                'Uploaded images may remain stored after the item that used them is deleted.',
            ] },
            { title: 'Security', body: 'Passwords and one-time codes are stored as hashes, sign-in uses secure HTTP-only cookies, saved card tokens are encrypted, and access is limited by role. No online system is completely risk-free.' },
            { title: 'Your rights', body: 'You can ask to access, correct, or delete your information by emailing hello@oo-ushers.com. Some records may be kept where required by law, including Egypt’s Personal Data Protection Law (No. 151 of 2020), or for legitimate operational needs such as payments and disputes.' },
        ]} />;
}
