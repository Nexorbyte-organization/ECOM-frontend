import type { Metadata } from 'next';
import LegalPage from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Cookie Policy | OO-Ushers' };

export default function CookiesPage() {
    return <LegalPage path="/cookies" title="Cookie Policy"
        intro="OO-Ushers uses a small set of cookies and browser storage that are needed to run and secure the service. We do not use advertising or tracking cookies."
        sections={[
            { title: 'Essential cookies', points: [
                'oo_access: keeps you signed in. Secure, HTTP-only, lasts 15 minutes and is renewed automatically.',
                'oo_refresh: renews your sign-in. Secure, HTTP-only, lasts up to 30 days. Signing in on another device or resetting your password ends it.',
                'These cookies cannot be read by page scripts and are not used for advertising.',
            ] },
            { title: 'Browser storage', points: [
                'Your language and theme, so the interface remembers your preferences.',
                'A cached copy of your basic profile (no password or sign-in tokens), so pages load faster.',
                'Short-lived values for the current tab only, such as where to return after signing in, a referral invite you opened, and the steps of a password reset. These are cleared when you close the tab.',
            ] },
            { title: 'Managing cookies and storage', body: 'You can clear cookies and site data in your browser at any time. This signs you out and resets your preferences. Blocking essential cookies stops sign-in and account features from working.' },
        ]} />;
}
