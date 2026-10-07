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

    const whyFeatures = [
      {
        title: isArabic ? arCopy('ملفات منظّمين واضحة', 'بروفايلات أشرز واضحة') : 'Detailed Usher Profiles',
        desc: isArabic ? arCopy('راجع الخبرة واللغات والمدن وسجل الفعاليات قبل الاختيار', 'شوف الخبرة واللغات والمدن وتاريخ الإيفينتس قبل ما تختار') : 'Review experience, languages, cities, and event history before choosing',
      },
      {
        title: isArabic ? arCopy('طلبات تقديم منظّمة', 'طلبات التقديم في مكان واحد') : 'Organized Applications',
        desc: isArabic ? arCopy('استقبل طلبات المنظمين وراجعها واقبل الأنسب لفعاليتك', 'استقبل طلبات الأشرز وراجعها واختار الأنسب لإيفينتك') : 'Receive usher applications, review them, and accept the right fit',
      },
      {
        title: isArabic ? arCopy('إدارة قائمة المنظمين', 'إدارة ليستة الأشرز') : 'Usher Roster Management',
        desc: isArabic ? arCopy('اطلع على المنظمين المقبولين والمحجوزين لكل فعالية', 'شوف الأشرز المقبولين والمحجوزين لكل إيفينت') : 'See every accepted and booked usher for each event in one place',
      },
      {
        title: isArabic ? arCopy('سجل الحضور', 'متابعة الحضور') : 'Attendance Records',
        desc: isArabic ? arCopy('سجّل الحضور والغياب واحتفظ بسجل واضح لكل فعالية', 'سجّل مين حضر ومين غاب وخلي تاريخ كل إيفينت واضح') : 'Record attendance and absences with a clear history for every event',
      },
      {
        title: isArabic ? arCopy('تقييمات بعد الفعالية', 'تقييمات بعد الإيفينت') : 'Post-Event Ratings',
        desc: isArabic ? arCopy('قيّم أداء المنظمين وساعد الملتزمين على بناء سمعتهم', 'قيّم أداء الأشرز وساعد الملتزمين يبنوا سمعة أقوى') : 'Rate usher performance and help reliable people build their reputation',
      },
      {
        title: isArabic ? arCopy('سجل التحذيرات', 'تحذيرات الاعتذار المتأخر') : 'Warning Records',
        desc: isArabic ? arCopy('تظهر الاعتذارات المتأخرة ومشكلات الالتزام المتكررة بوضوح', 'الاعتذارات المتأخرة ومشاكل الالتزام المتكررة بتبان بوضوح') : 'Late excuses and repeated reliability issues remain clearly visible',
      },
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
    const h2 = 'display text-[2.5rem] sm:text-5xl text-dark-50' + (isArabic ? ' !text-4xl sm:!text-[2.75rem]' : '');
    const controlBtn = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-dark-500 hover:bg-dark-850 text-xs font-semibold text-dark-200 transition-colors cursor-pointer';

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
        {/* ─── HERO: the logo, scaled up into two windows ──────── */}
        <section className="bg-bottle text-bottle-text">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10 md:pt-20 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
              <div className="text-start">
                <h1 className={`display text-white ${isArabic ? 'text-[2.75rem] sm:text-6xl lg:text-7xl' : 'text-[3.5rem] sm:text-7xl lg:text-[5.75rem] xl:text-[6.5rem]'}`}>
                  {t('lp_hero_title')}
                </h1>
                <p className="mt-6 max-w-[36ch] text-lg leading-relaxed text-bottle-muted sm:text-xl">
                  {t('lp_hero_sub')}
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button id="find-staff-cta" variant="signal" size="lg" onClick={() => router.push('/register?role=provider')}>
                    {isArabic ? arCopy('ابحث عن موظفين', 'دوّر على ستاف') : 'Find Staff'}
                  </Button>
                  <button
                    id="become-usher-cta"
                    onClick={() => router.push('/register?role=talent')}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-bottle-line px-6 py-3 text-base font-semibold text-bottle-text transition-colors hover:bg-bottle-lift cursor-pointer"
                  >
                    {isArabic ? arCopy('انضم كموظف', 'اشتغل كأشر') : 'Become an Usher'}
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-3 sm:gap-4 lg:justify-end" dir="ltr">
                <div
                  role="img"
                  aria-label={t('lp_hero_photo_alt')}
                  className="punch-window w-[clamp(140px,40vw,200px)] lg:w-[clamp(220px,20vw,310px)]"
                  style={{ '--photo': 'url(/oo-ushers-event-hero.png)', '--zoom': '300%', '--px': '59%', '--py': '21%', '--delay': '0.2s' } as React.CSSProperties}
                />
                <div
                  aria-hidden="true"
                  className="punch-window w-[clamp(140px,40vw,200px)] lg:w-[clamp(220px,20vw,310px)]"
                  style={{ '--photo': 'url(/oo-ushers-event-hero.png)', '--zoom': '300%', '--px': '91%', '--py': '66%', '--delay': '0.55s' } as React.CSSProperties}
                />
              </div>
            </div>

            <ul className="mt-14 grid border-t border-bottle-line md:grid-cols-3 md:divide-x md:divide-bottle-line rtl:md:divide-x-reverse">
              {heroFacts.map((fact) => (
                <li key={fact} className="flex items-start gap-3 py-5 text-sm text-bottle-text md:px-6 md:first:ps-0">
                  <span aria-hidden="true" className="mt-1 size-2.5 shrink-0 rounded-full border-[1.5px] border-accent-400" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── TWO WAYS IN ──────────────────────────────────── */}
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className={`${h2} max-w-[18ch] text-start`}>{t('lp_paths_title')}</h2>

            <div className="mt-12 grid gap-12 border-t border-dark-600 pt-12 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-dark-600 rtl:lg:divide-x-reverse">
              {[
                { key: 'org', heading: isArabic ? arCopy('لمنظمي الفعاليات', 'لمنظّمي الإيفينتس') : 'For Organizers', steps: orgSteps, cta: isArabic ? 'ابدأ التوظيف' : 'Start Hiring', href: '/register?role=provider', variant: 'primary' as const },
                { key: 'staff', heading: isArabic ? arCopy('للباحثين عن عمل', 'للستاف') : 'For Staff', steps: staffSteps, cta: isArabic ? 'ابحث عن فرصة عمل' : 'Find Your Next Gig', href: '/register?role=talent', variant: 'secondary' as const },
              ].map((col, colIndex) => (
                <div key={col.key} className={`text-start ${colIndex === 0 ? 'lg:pe-14' : 'lg:ps-14'}`}>
                  <h3 className="display-sm text-2xl text-dark-50">{col.heading}</h3>
                  <ol className="mt-8 space-y-7">
                    {col.steps.map((step, i) => (
                      <li key={step.title} className="flex gap-5">
                        <span aria-hidden="true" className="display-sm grid size-10 shrink-0 place-items-center rounded-full border-[1.5px] border-primary-500 text-lg text-primary-500">{i + 1}</span>
                        <div>
                          <p className="font-semibold text-dark-50">{step.title}</p>
                          <p className="mt-1 max-w-[44ch] text-sm leading-relaxed text-dark-300">{step.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <Button variant={col.variant} size="lg" className="mt-10" onClick={() => router.push(col.href)}>{col.cta}</Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ESTIMATOR ────────────────────────────────────── */}
        <section id="estimator" className="border-y border-dark-600 bg-dark-900 py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl text-start">
              <h2 className={h2}>{t('estimator_title')}</h2>
              <p className="mt-4 text-base leading-relaxed text-dark-300">{t('estimator_desc')}</p>
            </div>

            <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="space-y-10 text-start lg:col-span-7">

                <fieldset className="space-y-3">
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
                          className={`flex gap-3 rounded-lg border p-4 text-start transition-colors cursor-pointer ${selected ? 'border-primary-500 bg-dark-950' : 'border-dark-600 bg-dark-950 hover:border-dark-300'}`}
                        >
                          <span aria-hidden="true" className={`mt-1 size-3 shrink-0 rounded-full border-[1.5px] ${selected ? 'border-primary-500 bg-primary-500' : 'border-dark-400'}`} />
                          <span>
                            <span className="block text-sm font-semibold text-dark-50">{item.name}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-dark-300">{item.desc}</span>
                            <span className="mt-3 block text-sm font-semibold tabular-nums text-dark-50">{item.rate.toLocaleString()} EGP / {t('days').slice(0, 3)}</span>
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
                      <span className="display-sm text-2xl tabular-nums text-dark-50">{staffCount} <span className="text-sm font-medium text-dark-300">{t('ushers')}</span></span>
                    </div>
                    <input id="staff-range" type="range" min="1" max="30" value={staffCount} onChange={(e) => setStaffCount(parseInt(e.target.value))} className="estimator-range w-full cursor-pointer" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor="days-range" className="text-sm font-semibold text-dark-100">{t('duration')}</label>
                      <span className="display-sm text-2xl tabular-nums text-dark-50">{daysCount} <span className="text-sm font-medium text-dark-300">{t('days')}</span></span>
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
                          className={`flex items-start gap-3 rounded-lg border bg-dark-950 p-3.5 text-start transition-colors cursor-pointer ${selected ? 'border-primary-500' : 'border-dark-600 hover:border-dark-300'}`}
                        >
                          <span aria-hidden="true" className={`mt-0.5 size-3 shrink-0 rounded-full border-[1.5px] ${selected ? 'border-primary-500 bg-primary-500' : 'border-dark-400'}`} />
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

              {/* The quote: a bottle-green slip with the total in tungsten. */}
              <div className="rounded-xl bg-bottle p-6 text-start text-bottle-text sm:p-8 lg:sticky lg:top-24 lg:col-span-5">
                <h3 className="display-sm border-b border-bottle-line pb-4 text-2xl text-white">{t('est_summary')}</h3>

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
                  <p className="display mt-1 flex items-baseline gap-2 text-6xl tabular-nums text-accent-400" dir="ltr">
                    {totalEstimate.toLocaleString()} <span className="text-xl text-bottle-text">EGP</span>
                  </p>
                  <p className="mt-1 text-xs text-bottle-muted">{t('vat_inc')}</p>
                </div>

                <Button
                  variant="signal"
                  size="lg"
                  className="mt-7 w-full"
                  onClick={() => router.push(`/register?role=provider&staff=${staffCount}&days=${daysCount}&type=${eventType}`)}
                >
                  {t('lock_rate')}
                </Button>
                <p className="mt-3 text-center text-xs text-bottle-muted">{t('no_card')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CALL SHEET ───────────────────────────────────── */}
        <section id="duties" className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-14 text-start lg:grid-cols-2 lg:gap-20">
              <div>
                <h2 className={h2}>{t('duties_title')}</h2>
                <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-dark-300">{t('duties_desc')}</p>

                <ol className="mt-10 border-b border-dark-600">
                  {callSheet.map((step) => (
                    <li key={step.time} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-5 border-t border-dark-600 py-5">
                      <p className="display-sm flex items-center gap-2 text-xl text-primary-500">
                        {step.present && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-accent-400" />}
                        {step.time}
                      </p>
                      <div>
                        <h3 className="font-semibold text-dark-50">{step.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-dark-300">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="display-sm text-3xl text-dark-50">{t('trust_header')}</h3>
                <dl className="mt-8 border-b border-dark-600">
                  {[
                    { q: t('trust_q1'), a: t('trust_a1') },
                    { q: t('trust_q2'), a: t('trust_a2') },
                    { q: t('trust_q3'), a: t('trust_a3') },
                  ].map((pt) => (
                    <div key={pt.q} className="border-t border-dark-600 py-5">
                      <dt className="font-semibold text-dark-50">{pt.q}</dt>
                      <dd className="mt-1 max-w-[52ch] text-sm leading-relaxed text-dark-300">{pt.a}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-dark-50">{t('ready_to_hire')}</p>
                    <p className="text-sm text-dark-300">{t('reg_org')}</p>
                  </div>
                  <Button onClick={() => router.push('/register?role=provider')}>{t('create_org')}</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHAT THE RECORD SHOWS ────────────────────────── */}
        <section className="border-y border-dark-600 bg-dark-900 py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-start">
            <h2 className={`${h2} max-w-[20ch]`}>{t('lp_why_title')}</h2>
            <dl className="mt-12 grid gap-10 md:grid-cols-3">
              {whyFeatures.slice(0, 3).map((feat) => (
                <div key={feat.title} className="border-t-[3px] border-dark-50 pt-5">
                  <dt className="display-sm text-2xl text-dark-50">{feat.title}</dt>
                  <dd className="mt-3 max-w-[34ch] text-base leading-relaxed text-dark-300">{feat.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────────────────────── */}
        <section id="faq" className="py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-start">
            <h2 className={h2}>{t('faq_title')}</h2>
            <div className="mt-10 border-b border-dark-600">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className="border-t border-dark-600">
                    <button
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                      className="flex w-full items-center justify-between gap-6 py-5 text-start font-semibold text-dark-50 cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <Minus size={18} className="shrink-0 text-dark-300" aria-hidden="true" /> : <Plus size={18} className="shrink-0 text-dark-300" aria-hidden="true" />}
                    </button>
                    {isOpen && (
                      <div id={`faq-panel-${index}`} role="region" className="pb-6 pe-10 text-sm leading-relaxed text-dark-300">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── CLOSING ──────────────────────────────────────── */}
        <section className="bg-bottle text-bottle-text">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-start">
            <h2 className={`display max-w-[16ch] text-white ${isArabic ? 'text-4xl sm:text-6xl' : 'text-5xl sm:text-7xl'}`}>{t('lp_cta_title')}</h2>
            <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-bottle-muted">{t('banner_desc')}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button id="final-find-staff" variant="signal" size="lg" onClick={() => router.push('/register?role=provider')}>
                {t('hire_staff_short')}
              </Button>
              <button
                id="final-join-staff"
                onClick={() => router.push('/register?role=talent')}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-bottle-line px-6 py-3 text-base font-semibold text-bottle-text transition-colors hover:bg-bottle-lift cursor-pointer"
              >
                {t('apply_usher')}
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
