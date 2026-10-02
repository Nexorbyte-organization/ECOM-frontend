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
                'Activity: events, applications, booking invitations, referrals, excuses, attendance and check-in times, ratings and reviews, notifications, and payments.',
                'Security records: sign-in sessions and server logs used to protect accounts and investigate misuse.',
            ] },
            { title: 'How we use it', points: [
                'To run your account and keep it secure, including one active session per account.',
                'To match ushers with events, handle applications and invitations, record attendance, and calculate ratings, reliability, and verification.',
                'To process payments and payouts and keep payment records.',
                'To send notifications and service emails about your events, account, and payments.',
            ] },
            { title: 'Who can see your information', points: [
                'Other ushers see only your public profile: no phone numbers, email, or payout accounts.',
                'Organizations you apply to, or that invite you, can see your profile and contact details so they can coordinate the event. Payout account numbers are shown to them masked to the last 4 digits.',
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
