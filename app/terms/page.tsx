import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Terms of Service | OO-Ushers' };

export default function TermsPage() {
    return <LegalPage path="/terms" title="Terms of Service"
        intro="These terms govern use of OO-Ushers by event organizations, their staff, and ushers. The Usher Policy, Organization Policy, Payments & Fees policy, Privacy Policy, and Cookie Policy form part of these terms."
        sections={[
            { title: 'Who can use OO-Ushers', points: [
                'Ushers register to find and work at events. Organizations register to post events and book ushers. Organizations may add staff accounts (members and supervisors) who act on the organization’s behalf.',
                'You must verify your email before signing in. If the verification link expires, you can request a new one from the sign-in page.',
                'Provide accurate information and use only the role and organization you are authorized to represent.',
            ] },
            { title: 'Your account', points: [
                'Keep your password private. You are responsible for activity under your account.',
                'One active session per account: signing in on a new device signs out your other devices.',
                'Ratings, verification badges, and images cannot be set at registration. Ratings come only from reviews after events, and images only from uploads.',
                'Some actions, such as applying to events, creating events, and booking ushers, require a complete profile.',
            ] },
            { title: 'Platform role', body: 'OO-Ushers connects organizations with ushers and provides tools for applications, booking, attendance, ratings, and payments. Unless agreed in writing, OO-Ushers is not the employer, staffing agency, or agent of either party. Organizations are responsible for lawful working conditions at their events, and each party is responsible for its own legal and tax obligations.' },
            { title: 'Acceptable use', points: [
                'Do not create false profiles, events, ratings, or attendance records.',
                'Do not check in for someone else, share check-in codes with anyone who is not at the event, or fake your location.',
                'Do not misuse other users’ contact details, evade access controls, upload unlawful content, or use the platform for discrimination, harassment, fraud, or unsafe work.',
            ] },
            { title: 'Suspension and deletion', points: [
                'Administrators may block accounts that break these terms. Blocked accounts cannot sign in, and a blocked organization’s staff lose access too.',
                'When an account is deleted, it is removed from the service, but records may be kept as described in the Privacy Policy.',
                'Ushers who reach 5 late excuses cannot take new events until their account is reviewed, and ushers with 3 no-shows within 90 days are suspended for 30 days (see the Usher Policy).',
                'Organizations cannot cancel or delete events themselves; OO-Ushers support handles cancellations (see the Organization Policy and Payments & Fees).',
            ] },
            { title: 'Changes and liability', body: 'The service may change as the product develops, and we will update these terms and their effective date when it does. Nothing in these terms excludes rights or liability that cannot legally be excluded.' },
        ]} />;
}
