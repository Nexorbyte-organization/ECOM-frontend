import LegalPage from '@/components/shared/LegalPage';
export default function CookiesPage() { return <LegalPage title="Cookie Policy" intro="OO-Ushers uses a small set of browser storage technologies required to run and secure the service." sections={[
    { title: 'Essential cookies', body: 'Secure, HTTP-only session cookies keep you signed in and rotate authentication credentials. They are required for account features and are not used for advertising.' },
    { title: 'Local preferences', body: 'The browser may store your language, theme, and a limited cached user profile so the interface can restore your preferences. Passwords and bearer tokens are not stored in local storage.' },
    { title: 'Managing storage', body: 'You can clear cookies and site data in your browser. Doing so signs you out and resets saved preferences. Blocking essential cookies prevents authenticated features from working.' },
]}/>; }
