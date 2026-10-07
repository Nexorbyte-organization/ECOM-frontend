'use client';

import { PageSkeleton } from '@/components/ui/Skeleton';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import {
  Sun,
  Moon,
  Monitor,
  MapPin,
  Plus,
  Minus,
  QrCode,
  Wallet,
  ShieldCheck,
  Check,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTheme } from '@/lib/theme';
import LanguageDropdown from '@/components/shared/LanguageDropdown';
import BrandLogo from '@/components/shared/BrandLogo';
import { DateBlock, FillBar } from '@/components/ui/Ticket';

export default function HomePage() {
  const { user, isLoading, isTalent, isProvider, isAdmin } = useAuth();
  const router = useRouter();
  const { language, dir, t } = useLanguage();
  const isArabic = language === 'ar' || language === 'ar-eg';
  const isEgyptian = language === 'ar-eg';
  const arCopy = (formal: string, egyptian: string) => isEgyptian ? egyptian : formal;
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun size={14} />;
    if (theme === 'dark') return <Moon size={14} />;
    return <Monitor size={14} />;
  };

  // Interactive state for Quick Booking Estimator
  const [eventType, setEventType] = useState<'exhibition' | 'gala' | 'conference' | 'banquet'>('exhibition');
  const [staffCount, setStaffCount] = useState<number>(4);
  const [daysCount, setDaysCount] = useState<number>(2);
  const [uniformOption, setUniformOption] = useState<'formal' | 'smart-casual' | 'branded'>('formal');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [path, setPath] = useState<'org' | 'staff'>('org');

  // Redirection for logged-in users
  useEffect(() => {
    if (isLoading) return;
    if (user) {
      if (isTalent) {
        router.replace('/talent/dashboard');
      } else if (isProvider) {
        router.replace('/provider/dashboard');
      } else if (isAdmin) {
        router.replace('/admin/dashboard');
      }
    }
  }, [user, isLoading, isTalent, isProvider, isAdmin, router]);

  if (isLoading) return <PageSkeleton />;

  if (!user) {
    // Pricing configurations (with reactive translation hook)
    const rates: Record<string, { name: string; rate: number; desc: string }> = {
      exhibition: { name: t('service_exh'), rate: 1200, desc: t('service_exh_desc') },
      gala: { name: t('service_gala'), rate: 1800, desc: t('service_gala_desc') },
      conference: { name: t('service_conf'), rate: 1000, desc: t('service_conf_desc') },
      banquet: { name: t('service_banq'), rate: 1500, desc: t('service_banq_desc') }
    };

    const uniformFees = {
      formal: 0,
      'smart-casual': 0,
      branded: 150 // Printing fee
    };

    const totalEstimate = (staffCount * daysCount * rates[eventType].rate) + (uniformOption === 'branded' ? (staffCount * uniformFees.branded) : 0);

    const toggleFaq = (index: number) => {
      setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
      { question: t('faq_q1'), answer: t('faq_a1') },
      { question: t('faq_q2'), answer: t('faq_a2') },
      { question: t('faq_q3'), answer: t('faq_a3') },
      { question: t('faq_q4'), answer: t('faq_a4') }
    ];


    const navLinks = [
      { label: t('calculator'), href: '#estimator' },
      { label: t('timeline'), href: '#duties' },
      { label: t('faq'), href: '#faq' },
    ];

    const themeLabel = (key: string) =>
      key === 'light' ? (isArabic ? 'فاتح' : 'Light') : key === 'dark' ? (isArabic ? 'داكن' : 'Dark') : (isArabic ? 'تلقائي' : 'System');

    // Sequences are the one place numbers earn their keep: each step sits in a punched circle.
    const orgSteps = [
      { title: isArabic ? 'انشر فعاليتك' : 'Post Your Event', desc: isArabic ? 'أضف تفاصيل الفعالية، عدد الموظفين المطلوبين، والميزانية' : 'Add event details, required staff count, and budget' },
      { title: isArabic ? 'راجع الطلبات' : 'Review Applications', desc: isArabic ? 'اطلع على ملفات المتقدمين وتقييماتهم وسجلهم' : 'Browse applicant profiles, ratings, and track records' },
      { title: isArabic ? 'وظف فريقك' : 'Hire Your Team', desc: isArabic ? 'اقبل المتقدمين المناسبين وتواصل معهم مباشرة' : 'Accept the best fits and communicate directly' },
    ];
    const staffSteps = [
      { title: isArabic ? 'أنشئ ملفك الشخصي' : 'Create Your Profile', desc: isArabic ? 'أضف خبراتك، مهاراتك، ومعرض صورك الاحترافي' : 'Add your experience, skills, and professional portfolio' },
      { title: isArabic ? 'تقدم للفعاليات' : 'Apply to Events', desc: isArabic ? 'تصفح الفعاليات المتاحة وتقدم بنقرة واحدة' : 'Browse open events and apply with a single click' },
      { title: isArabic ? 'احصل على التوظيف' : 'Get Hired', desc: isArabic ? 'تلقَّ القبول واحصل على تفاصيل الفعالية وابدأ العمل' : 'Receive acceptance, get event details, and start working' },
    ];
    const callSheet = [
      { time: t('time_1'), title: t('d_title_1'), desc: t('d_desc_1') },
      { time: t('time_2'), title: t('d_title_2'), desc: t('d_desc_2'), present: true },
      { time: t('time_3'), title: t('d_title_3'), desc: t('d_desc_3') },
      { time: t('time_4'), title: t('d_title_4'), desc: t('d_desc_4') },
    ];
    const heroFacts = [t('lp_fact_1'), t('lp_fact_2'), t('lp_fact_3')];
    const h2 = 'display text-3xl sm:text-4xl text-dark-50';
    const controlBtn = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dark-500 hover:bg-dark-850 text-xs font-semibold text-dark-200 transition-colors cursor-pointer';

    return (
      <div className="min-h-screen bg-dark-950 text-dark-50 font-sans">

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-dark-950 border-b border-dark-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between gap-4">
            <BrandLogo href="/" />

            <nav className="hidden md:flex items-center gap-8" aria-label="Sections">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="nav-link text-sm font-medium text-dark-200 hover:text-dark-50 transition-colors">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setThemeOpen(!themeOpen)} id="theme-toggle" aria-expanded={themeOpen} className={controlBtn} title={`Theme: ${theme}`}>
                  {getThemeIcon()}
                  <span className="hidden sm:inline">{themeLabel(theme)}</span>
                </button>

                {themeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                    <div className="absolute end-0 mt-2 w-32 rounded-lg border border-dark-600 bg-dark-900 p-1.5 shadow-xl z-50 animate-scale-in">
                      {[
                        { key: 'light', icon: Sun },
                        { key: 'dark', icon: Moon },
                        { key: 'system', icon: Monitor },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = theme === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => { setTheme(item.key as 'light' | 'dark' | 'system'); setThemeOpen(false); }}
                            className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-start font-medium cursor-pointer transition-colors ${
                              isActive ? 'bg-primary-500 text-on-primary' : 'text-dark-200 hover:bg-dark-850'
                            }`}
                          >
                            <Icon size={13} />
                            {themeLabel(item.key)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <LanguageDropdown />

              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                  {t('login')}
                </Button>
                <Button id="signup-btn" variant="primary" size="sm" onClick={() => router.push('/register')}>
                  {t('signup')}
                </Button>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden grid size-10 place-items-center rounded-md border border-dark-500 text-dark-100" aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-dark-600 bg-dark-950 px-4 py-4 animate-fade-in">
              <nav className="flex flex-col" aria-label="Sections">
                {navLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="border-b border-dark-700 px-1 py-3.5 text-sm font-semibold text-dark-100">{link.label}</a>)}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => router.push('/login')}>{t('login')}</Button>
                  <Button onClick={() => router.push('/register')}>{t('signup')}</Button>
                </div>
              </nav>
            </div>
          )}
        </header>

        <main>
        {/* ─── HERO: one idea, fits one screen ──────────────────── */}
        <section className="bg-accent-50">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-20 lg:pt-16">
            <div className="text-start">
              <h1 className={`display max-w-[15ch] ${isArabic ? 'text-4xl sm:text-5xl lg:text-[3.4rem]' : 'text-[2.6rem] sm:text-6xl lg:text-[3.9rem]'}`}>
                {t('lp_hero_title')}
              </h1>
              <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-dark-300">{t('lp_hero_sub')}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button id="find-staff-cta" size="lg" onClick={() => router.push('/register?role=provider')}>
                  {isArabic ? arCopy('ابحث عن موظفين', 'دوّر على ستاف') : 'Find Staff'}
                </Button>
                <Button id="become-usher-cta" size="lg" variant="secondary" onClick={() => router.push('/register?role=talent')}>
                  {isArabic ? arCopy('انضم كموظف', 'اشتغل كأشر') : 'Become an Usher'}
                </Button>
              </div>
            </div>

            {/* The product, not a stock graphic: two photo punches and a real event row on top. */}
            <div className="relative mx-auto aspect-[5/4] w-full max-w-[34rem] overflow-hidden rounded-3xl bg-bottle lg:mx-0" dir="ltr">
              <div
                role="img"
                aria-label={t('lp_hero_photo_alt')}
                className="punch-window absolute start-[7%] top-[9%] w-[47%] ring-4 ring-white/10"
                style={{ '--photo': 'url(/oo-ushers-event-hero.png)', '--zoom': '300%', '--px': '59%', '--py': '21%', '--delay': '0.15s' } as React.CSSProperties}
              />
              <div
                aria-hidden="true"
                className="punch-window absolute end-[6%] top-[30%] w-[40%] ring-4 ring-white/10"
                style={{ '--photo': 'url(/oo-ushers-event-hero.png)', '--zoom': '300%', '--px': '91%', '--py': '66%', '--delay': '0.4s' } as React.CSSProperties}
              />
              <div aria-hidden="true" className="absolute bottom-[7%] start-[6%] w-[68%] max-w-[17rem] rounded-xl bg-white p-3 shadow-xl">
                <div className="flex items-center gap-3 text-ink">
                  <DateBlock date="2026-10-14" tone="coral" className="!size-12" />
                  <div className="min-w-0">
                    <p className="display-sm truncate text-[15px]">Brand launch</p>
                    <p className="text-xs text-[#53635C]">New Cairo</p>
                    <FillBar filled={8} total={12} className="mt-1 [&_span:last-child]:!text-[#53635C]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── What you get: one strip, not three cards ─────────── */}
        <section aria-label="What Usher records" className="border-b border-edge bg-dark-900">
          <ul className="mx-auto grid max-w-7xl gap-5 px-4 py-8 text-start sm:px-6 md:grid-cols-3 md:gap-10">
            {[
              { icon: QrCode, text: heroFacts[0], hue: 'bg-cat-teal/12 text-cat-teal-ink' },
              { icon: Wallet, text: heroFacts[1], hue: 'bg-cat-sun/15 text-cat-sun-ink' },
              { icon: ShieldCheck, text: heroFacts[2], hue: 'bg-cat-coral/12 text-cat-coral-ink' },
            ].map(({ icon: Icon, text, hue }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] font-medium text-dark-100">
                <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${hue}`}><Icon size={20} aria-hidden="true" /></span>
                {text}
              </li>
            ))}
          </ul>
        </section>

        {/* ─── Two ways in: one at a time ───────────────────────── */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 text-start sm:px-6 lg:grid-cols-[5fr_7fr] lg:gap-16">
            <div className={`rounded-2xl p-6 transition-colors duration-300 sm:p-8 ${path === 'org' ? 'bg-cat-sky/12' : 'bg-cat-coral/10'}`}>
              <div role="tablist" aria-label={t('lp_paths_title')} className="inline-flex rounded-xl bg-dark-900 p-1 shadow-sm">
                {[
                  { key: 'org' as const, label: isArabic ? arCopy('لمنظمي الفعاليات', 'لمنظّمي الإيفينتس') : 'For Organizers' },
                  { key: 'staff' as const, label: isArabic ? arCopy('للباحثين عن عمل', 'للستاف') : 'For Staff' },
                ].map((tab) => (
                  <button key={tab.key} role="tab" aria-selected={path === tab.key} onClick={() => setPath(tab.key)}
                    className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${path === tab.key ? 'bg-primary-500 text-on-primary' : 'text-dark-300 hover:text-dark-50'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <h2 className={`${h2} mt-6 max-w-[14ch]`}>{t('lp_paths_title')}</h2>
              <Button className="mt-8" size="lg" onClick={() => router.push(path === 'org' ? '/register?role=provider' : '/register?role=talent')}>
                {path === 'org' ? (isArabic ? arCopy('ابحث عن موظفين', 'دوّر على ستاف') : 'Find Staff') : (isArabic ? arCopy('انضم كموظف', 'اشتغل كأشر') : 'Become an Usher')}
              </Button>
            </div>
            <ol className="divide-y divide-edge border-y border-edge" aria-live="polite">
              {(path === 'org' ? orgSteps : staffSteps).map((step, i) => (
                <li key={step.title} className="flex gap-5 py-6">
                  <span aria-hidden="true" className={`display-sm grid size-9 shrink-0 place-items-center rounded-full text-lg ${['bg-cat-teal/12 text-cat-teal-ink', 'bg-cat-sun/15 text-cat-sun-ink', 'bg-cat-coral/12 text-cat-coral-ink'][i % 3]}`}>{i + 1}</span>
                  <div>
                    <p className="display-sm text-xl">{step.title}</p>
                    <p className="mt-1 max-w-[46ch] text-dark-300">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── Estimator ────────────────────────────────────────── */}
        <section id="estimator" className="border-y border-edge bg-primary-50/60 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl text-start">
              <h2 className={h2}>{t('estimator_title')}</h2>
              <p className="mt-4 text-base leading-relaxed text-dark-300">{t('estimator_desc')}</p>
            </div>

            <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="space-y-10 text-start lg:col-span-7">
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-dark-100">{t('select_service')}</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.entries(rates).map(([key, item]) => {
                      const selected = eventType === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEventType(key as 'exhibition' | 'gala' | 'conference' | 'banquet')}
                          aria-pressed={selected}
                          className={`press flex gap-3 rounded-xl border bg-dark-900 p-4 text-start cursor-pointer ${selected ? 'border-primary-500 ring-4 ring-primary-500/15' : 'border-edge hover:border-dark-500'}`}
                        >
                          <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-primary-500 bg-primary-500 text-on-primary' : 'border-dark-500'}`}>{selected && <Check size={12} strokeWidth={3} />}</span>
                          <span>
                            <span className="block text-sm font-semibold text-dark-50">{item.name}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-dark-300">{item.desc}</span>
                            <span className="mt-3 block text-sm font-semibold tabular-nums text-primary-600 dark:text-primary-400">{item.rate.toLocaleString()} EGP / {t('days').slice(0, 3)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor="staff-range" className="text-sm font-semibold text-dark-100">{t('num_staff')}</label>
                      <span className="display-sm text-2xl tabular-nums">{staffCount} <span className="text-sm font-medium text-dark-300">{t('ushers')}</span></span>
                    </div>
                    <input id="staff-range" type="range" min="1" max="30" value={staffCount} onChange={(e) => setStaffCount(parseInt(e.target.value))} className="estimator-range w-full cursor-pointer" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor="days-range" className="text-sm font-semibold text-dark-100">{t('duration')}</label>
                      <span className="display-sm text-2xl tabular-nums">{daysCount} <span className="text-sm font-medium text-dark-300">{t('days')}</span></span>
                    </div>
                    <input id="days-range" type="range" min="1" max="10" value={daysCount} onChange={(e) => setDaysCount(parseInt(e.target.value))} className="estimator-range w-full cursor-pointer" />
                  </div>
                </div>

                <fieldset>
                  <legend className="mb-3 text-sm font-semibold text-dark-100">{t('uniform_opt')}</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { key: 'formal', name: t('suit_tux'), note: t('std_free') },
                      { key: 'smart-casual', name: t('smart_casual'), note: t('std_free') },
                      { key: 'branded', name: t('branded_polo'), note: t('print_fee') },
                    ].map((opt) => {
                      const selected = uniformOption === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setUniformOption(opt.key as 'formal' | 'smart-casual' | 'branded')}
                          aria-pressed={selected}
                          className={`press flex items-start gap-3 rounded-xl border bg-dark-900 p-3.5 text-start cursor-pointer ${selected ? 'border-primary-500 ring-4 ring-primary-500/15' : 'border-edge hover:border-dark-500'}`}
                        >
                          <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-primary-500 bg-primary-500 text-on-primary' : 'border-dark-500'}`}>{selected && <Check size={12} strokeWidth={3} />}</span>
                          <span>
                            <span className="block text-sm font-semibold text-dark-50">{opt.name}</span>
                            <span className="mt-0.5 block text-xs text-dark-300">{opt.note}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="rounded-2xl bg-bottle p-6 text-start text-bottle-text sm:p-8 lg:sticky lg:top-24 lg:col-span-5">
                <h3 className="display-sm border-b border-bottle-line pb-4 text-xl text-white">{t('est_summary')}</h3>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-bottle-muted">{t('est_rate')}</dt><dd className="tabular-nums">{rates[eventType].rate.toLocaleString()} EGP / {t('days').slice(0, 3)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-bottle-muted">{t('est_hired')}</dt><dd>{staffCount} {t('ushers')}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-bottle-muted">{t('est_duration')}</dt><dd>{daysCount} {t('days')}</dd></div>
                  {uniformOption === 'branded' && (
                    <div className="flex justify-between gap-4"><dt className="text-bottle-muted">{t('est_polo')}</dt><dd className="tabular-nums">+{(staffCount * uniformFees.branded).toLocaleString()} EGP</dd></div>
                  )}
                </dl>
                <div className="mt-6 border-t border-bottle-line pt-5">
                  <p className="text-sm text-bottle-muted">{t('est_total')}</p>
                  <p className="display mt-1 flex items-baseline gap-2 text-5xl tabular-nums text-accent-400" dir="ltr">
                    {totalEstimate.toLocaleString()} <span className="text-lg text-bottle-text">EGP</span>
                  </p>
                  <p className="mt-1 text-xs text-bottle-muted">{t('vat_inc')}</p>
                </div>
                <Button variant="signal" size="lg" className="mt-7 w-full" onClick={() => router.push(`/register?role=provider&staff=${staffCount}&days=${daysCount}&type=${eventType}`)}>
                  {t('lock_rate')}
                </Button>
                <p className="mt-3 text-center text-xs text-bottle-muted">{t('no_card')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Event day: a timeline, beside what stays on record ─ */}
        <section id="duties" className="py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 text-start sm:px-6 lg:grid-cols-[7fr_5fr] lg:gap-20">
            <div>
              <h2 className={`${h2} max-w-[18ch]`}>{t('duties_title')}</h2>
              <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-dark-300">{t('duties_desc')}</p>
              <ol className="relative mt-10 space-y-8 border-s border-edge ps-8">
                {callSheet.map((step, i) => (
                  <li key={step.time} className="relative">
                    <span aria-hidden="true" className={`absolute -start-[39px] top-1 size-3.5 rounded-full border-2 border-dark-950 ${step.present ? 'live-dot bg-accent-450' : ['bg-cat-sky', 'bg-cat-sun', 'bg-cat-teal', 'bg-cat-coral'][i % 4]}`} />
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">{step.time}</p>
                    <h3 className="display-sm mt-0.5 text-xl">{step.title}</h3>
                    <p className="mt-1 max-w-[48ch] text-dark-300">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="lg:pt-24">
              <h3 className="display-sm text-2xl">{t('trust_header')}</h3>
              <dl className="mt-6 divide-y divide-edge border-y border-edge">
                {[
                  { q: t('trust_q1'), a: t('trust_a1') },
                  { q: t('trust_q2'), a: t('trust_a2') },
                  { q: t('trust_q3'), a: t('trust_a3') },
                ].map((pt) => (
                  <div key={pt.q} className="py-5">
                    <dt className="font-semibold text-dark-50">{pt.q}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-dark-300">{pt.a}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-dark-50">{t('ready_to_hire')}</p>
                  <p className="text-sm text-dark-300">{t('reg_org')}</p>
                </div>
                <Button onClick={() => router.push('/register?role=provider')}>{t('create_org')}</Button>
              </div>
            </aside>
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" className="border-t border-edge bg-dark-900 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-start sm:px-6">
            <h2 className={h2}>{t('faq_title')}</h2>
            <div className="mt-10 divide-y divide-edge border-y border-edge">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index}>
                    <button
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                      className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-start font-semibold text-dark-50"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <Minus size={18} className="shrink-0 text-primary-500" aria-hidden="true" /> : <Plus size={18} className="shrink-0 text-dark-300" aria-hidden="true" />}
                    </button>
                    {isOpen && (
                      <div id={`faq-panel-${index}`} role="region" className="animate-fade-in pb-6 pe-10 text-sm leading-relaxed text-dark-300">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Closing ──────────────────────────────────────────── */}
        <section className="bg-bottle text-bottle-text">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 text-start sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={`display max-w-[16ch] text-white ${isArabic ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-5xl'}`}>{t('lp_cta_title')}</h2>
              <p className="mt-4 max-w-[48ch] leading-relaxed text-bottle-muted">{t('banner_desc')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button id="final-find-staff" variant="signal" size="lg" onClick={() => router.push('/register?role=provider')}>
                {isArabic ? arCopy('ابحث عن موظفين', 'دوّر على ستاف') : 'Find Staff'}
              </Button>
              <button id="final-join-staff" onClick={() => router.push('/register?role=talent')}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-lg border border-white/30 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10">
                {isArabic ? arCopy('انضم كموظف', 'اشتغل كأشر') : 'Become an Usher'}
              </button>
            </div>
          </div>
        </section>
        </main>

        {/* ─── FOOTER ───────────────────────────────────────── */}
        <footer className="border-t border-dark-600 pt-16 pb-8 text-start">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-4">
                <BrandLogo />
                <p className="max-w-xs text-sm leading-relaxed text-dark-300">
                  {isArabic
                    ? 'منصة التوظيف الاحترافية لفعالياتك. اربط أفضل الكوادر مع أفضل الفرص.'
                    : 'The professional staffing marketplace for your events. Connect the best talent with the best opportunities.'}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  {[
                    { icon: Twitter, href: '#', label: 'Twitter' },
                    { icon: Linkedin, href: '#', label: 'LinkedIn' },
                    { icon: Instagram, href: '#', label: 'Instagram' },
                    { icon: Facebook, href: '#', label: 'Facebook' },
                  ].map(({ icon: Icon, href, label }) => (
                    <a key={label} href={href} aria-label={label} className="grid size-9 place-items-center rounded-md border border-dark-500 text-dark-300 transition-colors hover:border-dark-50 hover:text-dark-50">
                      <Icon size={15} />
                    </a>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-dark-50">{isArabic ? 'المنصة' : 'Platform'}</h4>
                <ul className="space-y-2.5">
                  {[
                    { label: isArabic ? 'الرئيسية' : 'Home', href: '/' },
                    { label: isArabic ? 'الفعاليات' : 'Events', href: '#estimator' },
                    { label: isArabic ? 'الموظفون' : 'Staff', href: '#' },
                    { label: isArabic ? 'الأسعار' : 'Pricing', href: '#estimator' },
                  ].map((link) => (
                    <li key={link.label}><a href={link.href} className="text-sm text-dark-300 transition-colors hover:text-dark-50">{link.label}</a></li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-dark-50">{isArabic ? 'الشركة' : 'Company'}</h4>
                <ul className="space-y-2.5">
                  {[
                    { label: isArabic ? 'عن المنصة' : 'About', href: '#' },
                    { label: isArabic ? 'تواصل معنا' : 'Contact', href: '#' },
                    { label: isArabic ? 'الشروط والأحكام' : 'Terms of Service', href: '#' },
                    { label: isArabic ? 'سياسة الخصوصية' : 'Privacy Policy', href: '#' },
                  ].map((link) => (
                    <li key={link.label}><a href={link.href} className="text-sm text-dark-300 transition-colors hover:text-dark-50">{link.label}</a></li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-dark-50">{isArabic ? 'تواصل معنا' : 'Get in Touch'}</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-dark-300"><Mail size={15} className="shrink-0 text-dark-400" aria-hidden="true" />hello@oo-ushers.com</li>
                  <li className="flex items-center gap-3 text-sm text-dark-300"><MapPin size={15} className="shrink-0 text-dark-400" aria-hidden="true" />{isArabic ? 'القاهرة، مصر' : 'Cairo, Egypt'}</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-dark-600 pt-6 sm:flex-row">
              <p className="text-xs text-dark-400">© {new Date().getFullYear()} OO-Ushers. {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {[
                  { href: '/terms', label: isArabic ? 'الشروط' : 'Terms' },
                  { href: '/privacy', label: isArabic ? 'الخصوصية' : 'Privacy' },
                  { href: '/cookies', label: isArabic ? 'ملفات تعريف الارتباط' : 'Cookies' },
                  { href: '/policies/ushers', label: isArabic ? 'سياسة المضيفين' : 'Usher Policy' },
                  { href: '/policies/organizations', label: isArabic ? 'سياسة المؤسسات' : 'Organization Policy' },
                  { href: '/policies/payments', label: isArabic ? 'المدفوعات والرسوم' : 'Payments & Fees' },
                ].map((link) => (
                  <a key={link.href} href={link.href} className="text-xs text-dark-400 transition-colors hover:text-dark-50">{link.label}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    );
  }

  return null;
}
