import LegalPage from '@/components/shared/LegalPage';
export default function TermsPage() { return <LegalPage title="Terms of Service" intro="These terms govern use of OO-Ushers by event organizers, their staff, and talent." sections={[
    { title: 'Accounts', body: 'Provide accurate information, protect your account, and use only the role and organization you are authorized to represent. We may suspend fraudulent, unsafe, or abusive accounts.' },
    { title: 'Events and work', body: 'Organizers are responsible for accurate event details, lawful working conditions, attendance records, and agreed compensation. Talent are responsible for truthful profiles, applications, availability, and attendance.' },
    { title: 'Platform role', body: 'OO-Ushers facilitates introductions and event staffing workflows. Unless expressly agreed in writing, it is not the employer, staffing agency, or representative of either party.' },
    { title: 'Acceptable use', body: 'Do not misuse another person’s data, evade access controls, upload unlawful content, disrupt the service, or use the platform for discrimination, harassment, fraud, or unsafe work.' },
    { title: 'Liability and changes', body: 'The service is provided subject to applicable law and may change as the product develops. Nothing in these terms excludes rights or liability that cannot legally be excluded.' },
]}/>; }
