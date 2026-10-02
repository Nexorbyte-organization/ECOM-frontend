import Link from 'next/link';
import BrandLogo from './BrandLogo';

export type LegalSection = { title: string; body?: string; points?: string[] };

export const LEGAL_PAGES = [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/policies/ushers', label: 'Usher Policy' },
    { href: '/policies/organizations', label: 'Organization Policy' },
    { href: '/policies/payments', label: 'Payments & Fees' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookies', label: 'Cookie Policy' },
];

export const LEGAL_EFFECTIVE_DATE = 'October 2, 2026';

export default function LegalPage({ title, intro, sections, path }: {
    title: string; intro: string; sections: LegalSection[]; path: string;
}) {
    return <main className="min-h-screen px-5 py-12"><article className="mx-auto max-w-3xl">
        <Link href="/" className="inline-block mb-10"><BrandLogo /></Link>
        <p className="section-tag mb-3">LEGAL</p><h1 className="text-4xl font-black text-dark-50">{title}</h1>
        <p className="mt-3 text-sm text-dark-500">Effective {LEGAL_EFFECTIVE_DATE}</p>
        <nav aria-label="Policies" className="mt-6 flex flex-wrap gap-2">
            {LEGAL_PAGES.map((page) => (
                <Link key={page.href} href={page.href} aria-current={page.href === path ? 'page' : undefined}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${page.href === path
                        ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                        : 'border-dark-700 text-dark-400 hover:border-primary-300 hover:text-primary-500'}`}>
                    {page.label}
                </Link>
            ))}
        </nav>
        <p className="mt-8 text-lg text-dark-300 leading-8">{intro}</p>
        <div className="mt-10 space-y-8">{sections.map((section) => <section key={section.title}>
            <h2 className="text-xl font-black text-dark-100">{section.title}</h2>
            {section.body && <p className="mt-2 text-dark-400 leading-7 whitespace-pre-line">{section.body}</p>}
            {section.points && <ul className="mt-3 list-disc space-y-2 ps-5 text-dark-400 leading-7">
                {section.points.map((point) => <li key={point}>{point}</li>)}
            </ul>}
        </section>)}</div>
        <p className="mt-12 border-t border-dark-700 pt-6 text-sm text-dark-500">Questions: <a className="text-primary-500" href="mailto:hello@oo-ushers.com">hello@oo-ushers.com</a></p>
    </article></main>;
}
