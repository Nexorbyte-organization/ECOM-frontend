import Link from 'next/link';
import BrandLogo from './BrandLogo';

export default function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: { title: string; body: string }[] }) {
    return <main className="min-h-screen px-5 py-12"><article className="mx-auto max-w-3xl">
        <Link href="/" className="inline-block mb-10"><BrandLogo /></Link>
        <p className="section-tag mb-3">LEGAL</p><h1 className="text-4xl font-black text-dark-50">{title}</h1>
        <p className="mt-3 text-sm text-dark-500">Effective September 13, 2026</p>
        <p className="mt-6 text-lg text-dark-300 leading-8">{intro}</p>
        <div className="mt-10 space-y-8">{sections.map((section) => <section key={section.title}>
            <h2 className="text-xl font-black text-dark-100">{section.title}</h2><p className="mt-2 text-dark-400 leading-7 whitespace-pre-line">{section.body}</p>
        </section>)}</div>
        <p className="mt-12 border-t border-dark-700 pt-6 text-sm text-dark-500">Questions: <a className="text-primary-500" href="mailto:hello@oo-ushers.com">hello@oo-ushers.com</a></p>
    </article></main>;
}
