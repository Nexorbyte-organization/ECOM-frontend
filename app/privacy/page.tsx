import LegalPage from '@/components/shared/LegalPage';
export default function PrivacyPage() { return <LegalPage title="Privacy Policy" intro="This policy explains the information OO-Ushers processes to operate its event staffing platform." sections={[
    { title: 'Information we collect', body: 'Account and profile details, contact information, event applications, referrals, attendance, reviews, uploaded images, organization records, and technical security logs.' },
    { title: 'How we use it', body: 'To authenticate users, match talent with events, manage staffing and attendance, communicate service messages, prevent abuse, provide support, and meet legal obligations.' },
    { title: 'Sharing', body: 'Relevant profile and event information is shared with users involved in a staffing workflow. Service providers may process data for hosting, email, image storage, and security under appropriate instructions.' },
    { title: 'Retention and security', body: 'We retain information only as needed for the service, disputes, safety, and legal requirements. We use access controls and other safeguards, but no online system is completely risk-free.' },
    { title: 'Your choices', body: 'You may request access, correction, or deletion where applicable by contacting us. Some records may be retained where required by law or legitimate operational needs.' },
]}/>; }
