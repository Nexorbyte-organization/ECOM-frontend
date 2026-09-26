'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import {
  Sparkles,
  ArrowRight,
  Users,
  Calendar,
  Award,
  ShieldCheck,
  Star,
  Clock,
  ChevronDown,
  ChevronUp,
  Tag,
  Info,
  CalendarDays,
  CheckCircle,
  Sun,
  Moon,
  Monitor,
  MapPin,
  MessageSquare,
  UserCheck,
  Briefcase,
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
    if (theme === 'light') return <Sun size={14} className="text-primary-500" />;
    if (theme === 'dark') return <Moon size={14} className="text-primary-500" />;
    return <Monitor size={14} className="text-primary-500" />;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto relative">
            <img src="/logo-light.png" alt="OO-Ushers Logo" className="w-16 h-16 object-contain dark-logo-hidden" />
            <img src="/logo-dark.png" alt="OO-Ushers Logo" className="w-16 h-16 object-contain dark-logo-block" />
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

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
        icon: Users,
        title: isArabic ? arCopy('ملفات منظّمين واضحة', 'بروفايلات أشرز واضحة') : 'Detailed Usher Profiles',
        desc: isArabic ? arCopy('راجع الخبرة واللغات والمدن وسجل الفعاليات قبل الاختيار', 'شوف الخبرة واللغات والمدن وتاريخ الإيفينتس قبل ما تختار') : 'Review experience, languages, cities, and event history before choosing',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        icon: Briefcase,
        title: isArabic ? arCopy('طلبات تقديم منظّمة', 'طلبات التقديم في مكان واحد') : 'Organized Applications',
        desc: isArabic ? arCopy('استقبل طلبات المنظمين وراجعها واقبل الأنسب لفعاليتك', 'استقبل طلبات الأشرز وراجعها واختار الأنسب لإيفينتك') : 'Receive usher applications, review them, and accept the right fit',
        color: 'text-primary-600',
        bg: 'bg-primary-50',
      },
      {
        icon: UserCheck,
        title: isArabic ? arCopy('إدارة قائمة المنظمين', 'إدارة ليستة الأشرز') : 'Usher Roster Management',
        desc: isArabic ? arCopy('اطلع على المنظمين المقبولين والمحجوزين لكل فعالية', 'شوف الأشرز المقبولين والمحجوزين لكل إيفينت') : 'See every accepted and booked usher for each event in one place',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      },
      {
        icon: Calendar,
        title: isArabic ? arCopy('سجل الحضور', 'متابعة الحضور') : 'Attendance Records',
        desc: isArabic ? arCopy('سجّل الحضور والغياب واحتفظ بسجل واضح لكل فعالية', 'سجّل مين حضر ومين غاب وخلي تاريخ كل إيفينت واضح') : 'Record attendance and absences with a clear history for every event',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
      },
      {
        icon: Star,
        title: isArabic ? arCopy('تقييمات بعد الفعالية', 'تقييمات بعد الإيفينت') : 'Post-Event Ratings',
        desc: isArabic ? arCopy('قيّم أداء المنظمين وساعد الملتزمين على بناء سمعتهم', 'قيّم أداء الأشرز وساعد الملتزمين يبنوا سمعة أقوى') : 'Rate usher performance and help reliable people build their reputation',
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      {
        icon: ShieldCheck,
        title: isArabic ? arCopy('سجل التحذيرات', 'تحذيرات الاعتذار المتأخر') : 'Warning Records',
        desc: isArabic ? arCopy('تظهر الاعتذارات المتأخرة ومشكلات الالتزام المتكررة بوضوح', 'الاعتذارات المتأخرة ومشاكل الالتزام المتكررة بتبان بوضوح') : 'Late excuses and repeated reliability issues remain clearly visible',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
      },
    ];

    const navLinks = [
      { label: t('calculator'), href: '#estimator' },
      { label: t('timeline'), href: '#duties' },
      { label: t('faq'), href: '#faq' },
    ];

    return (
      <div
        className="min-h-screen bg-dark-950 text-dark-50 font-sans"
        style={{ fontFamily: isArabic ? "'Cairo', Tahoma, sans-serif" : "'Avenir Next', 'Segoe UI', sans-serif" }}
      >

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-dark-950/85 backdrop-blur-xl border-b border-dark-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[76px] flex items-center justify-between gap-4">

            {/* Logo */}
            <BrandLogo href="/" />

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="nav-link text-sm font-medium text-dark-200 hover:text-primary-500 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Theme Selector */}
              <div className="relative">
                <button
                  onClick={() => setThemeOpen(!themeOpen)}
                  id="theme-toggle"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dark-600 bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-dark-200 transition-all cursor-pointer"
                  title={`Theme: ${theme}`}
                >
                  {getThemeIcon()}
                  <span className="capitalize hidden sm:inline text-dark-200">
                    {theme === 'light' ? (isArabic ? 'فاتح' : 'Light') :
                     theme === 'dark' ? (isArabic ? 'داكن' : 'Dark') :
                     (isArabic ? 'تلقائي' : 'System')}
                  </span>
                </button>

                {themeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                    <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-32 rounded-xl border border-dark-600 bg-dark-900 p-1.5 shadow-lg z-50 animate-scale-in">
                      {[
                        { key: 'light', label: isArabic ? 'فاتح' : 'Light', icon: Sun },
                        { key: 'dark', label: isArabic ? 'داكن' : 'Dark', icon: Moon },
                        { key: 'system', label: isArabic ? 'تلقائي' : 'System', icon: Monitor },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = theme === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => { setTheme(item.key as 'light' | 'dark' | 'system'); setThemeOpen(false); }}
                            className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-lg text-start font-medium cursor-pointer transition-colors ${
                              isActive ? 'bg-primary-500 text-white' : 'text-dark-200 hover:bg-dark-700'
                            }`}
                          >
                            <Icon size={13} className={isActive ? 'text-white' : 'text-primary-500'} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <LanguageDropdown />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/login')}
                className="hidden sm:inline-flex font-semibold text-dark-200 hover:text-dark-50 hover:bg-dark-800 rounded-lg border-transparent"
              >
                {t('login')}
              </Button>
              <Button
                id="signup-btn"
                variant="primary"
                size="sm"
                onClick={() => router.push('/register')}
                className="hidden sm:inline-flex font-semibold rounded-lg shadow-sm"
              >
                {t('signup')}
              </Button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden grid size-10 place-items-center rounded-xl border border-dark-600 bg-dark-900 text-dark-100" aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-dark-700 bg-dark-900 px-4 py-4 animate-fade-in">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-bold text-dark-200 hover:bg-dark-800">{link.label}</a>)}
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-dark-700 pt-3">
                  <Button variant="secondary" onClick={() => router.push('/login')}>{t('login')}</Button>
                  <Button onClick={() => router.push('/register')}>{t('signup')}</Button>
                </div>
              </nav>
            </div>
          )}
        </header>

        {/* ─── HERO SECTION ─────────────────────────────────── */}
        <section className="relative overflow-hidden bg-dark-950 pt-12 pb-20 md:pt-20 md:pb-28">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-500/5 blur-3xl" />
            <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-accent-500/5 blur-3xl" />
          </div>

          {/* Hero background image with overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/oo-ushers-event-hero.png"
              alt="Professional ushers welcoming and directing guests at an event"
              className="w-full h-full object-cover object-center opacity-90"
              style={{ filter: 'saturate(0.9) contrast(1.04)' }}
            />
            <div className="hero-photo-overlay absolute inset-0" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-dark-50 leading-[1.02] tracking-[-0.045em] mb-6 animate-fade-in">
                {isArabic ? (
                  <>
                    {arCopy('ابحث عن موظفين', 'هات ستاف')}<br />
                    <span className="text-primary-500">{arCopy('احترافيين', 'محترف')}</span> {arCopy('لأي فعالية', 'لأي إيفينت')}
                  </>
                ) : (
                  <>
                    Find Professional<br />
                    <span className="text-primary-500">Event Staff</span> for Any Event
                  </>
                )}
              </h1>

              <p className="text-lg sm:text-xl text-dark-300 max-w-xl leading-relaxed mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {isArabic
                  ? arCopy('احجز منظمين محترفين لفعاليتك خلال دقائق.', 'احجز أشرز محترفين لإيفينتك في دقايق.')
                  : 'Book professional ushers for your event in minutes.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <button
                  id="find-staff-cta"
                  onClick={() => router.push('/register?role=provider')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-primary-500/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  {isArabic ? arCopy('ابحث عن موظفين', 'دوّر على ستاف') : 'Find Staff'}
                  <ArrowRight size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />
                </button>
                <button
                  id="become-usher-cta"
                  onClick={() => router.push('/register?role=talent')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-dark-800 hover:bg-dark-700 text-dark-50 font-semibold rounded-xl border border-dark-600 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  {isArabic ? arCopy('انضم كموظف', 'اشتغل كأشر') : 'Become an Usher'}
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success-500/15 flex items-center justify-center">
                    <Clock size={15} className="text-success-500" />
                  </div>
                  <span className="text-sm font-medium text-dark-300">{t('trust_1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-500/15 flex items-center justify-center">
                    <Star size={15} className="text-primary-500" />
                  </div>
                  <span className="text-sm font-medium text-dark-300">{t('trust_2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-warning-500/15 flex items-center justify-center">
                    <ShieldCheck size={15} className="text-warning-500" />
                  </div>
                  <span className="text-sm font-medium text-dark-300">{t('trust_3')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────── */}
        <section className="py-20 bg-dark-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="section-tag mb-4 inline-flex">
                <Sparkles size={11} />
                {isArabic ? arCopy('كيف تعمل المنصة', 'الموضوع بيمشي إزاي') : 'How It Works'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark-50 mt-3">
                {isArabic ? arCopy('توظيف سهل وسريع', 'كوّن فريقك بسرعة وسهولة') : 'Simple & Fast Hiring'}
              </h2>
              <p className="text-dark-300 mt-3 max-w-xl mx-auto text-base">
                {isArabic
                  ? 'سواء كنت منظم فعاليات أو باحثاً عن عمل، البدء بسيط'
                  : 'Whether you\'re an organizer or looking for work, getting started is simple'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* For Organizers */}
              <div className="card-premium p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                    <Briefcase size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-50">
                    {isArabic ? arCopy('لمنظمي الفعاليات', 'لمنظّمي الإيفينتس') : 'For Organizers'}
                  </h3>
                </div>
                <div className="space-y-5">
                  {[
                    {
                      step: '01',
                      title: isArabic ? 'انشر فعاليتك' : 'Post Your Event',
                      desc: isArabic ? 'أضف تفاصيل الفعالية، عدد الموظفين المطلوبين، والميزانية' : 'Add event details, required staff count, and budget'
                    },
                    {
                      step: '02',
                      title: isArabic ? 'راجع الطلبات' : 'Review Applications',
                      desc: isArabic ? 'اطلع على ملفات المتقدمين وتقييماتهم وسجلهم' : 'Browse applicant profiles, ratings, and track records'
                    },
                    {
                      step: '03',
                      title: isArabic ? 'وظف فريقك' : 'Hire Your Team',
                      desc: isArabic ? 'اقبل المتقدمين المناسبين وتواصل معهم مباشرة' : 'Accept the best fits and communicate directly'
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-600">{item.step}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-dark-50">{item.title}</p>
                        <p className="text-xs text-dark-300 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/register?role=provider')}
                  className="mt-6 w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {isArabic ? 'ابدأ التوظيف' : 'Start Hiring'} →
                </button>
              </div>

              {/* For Staff */}
              <div className="card-premium p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center">
                    <UserCheck size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-dark-50">
                    {isArabic ? arCopy('للباحثين عن عمل', 'للستاف') : 'For Staff'}
                  </h3>
                </div>
                <div className="space-y-5">
                  {[
                    {
                      step: '01',
                      title: isArabic ? 'أنشئ ملفك الشخصي' : 'Create Your Profile',
                      desc: isArabic ? 'أضف خبراتك، مهاراتك، ومعرض صورك الاحترافي' : 'Add your experience, skills, and professional portfolio'
                    },
                    {
                      step: '02',
                      title: isArabic ? 'تقدم للفعاليات' : 'Apply to Events',
                      desc: isArabic ? 'تصفح الفعاليات المتاحة وتقدم بنقرة واحدة' : 'Browse open events and apply with a single click'
                    },
                    {
                      step: '03',
                      title: isArabic ? 'احصل على التوظيف' : 'Get Hired',
                      desc: isArabic ? 'تلقَّ القبول واحصل على تفاصيل الفعالية وابدأ العمل' : 'Receive acceptance, get event details, and start working'
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{item.step}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-dark-50">{item.title}</p>
                        <p className="text-xs text-dark-300 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/register?role=talent')}
                  className="mt-6 w-full py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-50 text-sm font-semibold rounded-xl border border-dark-600 transition-colors cursor-pointer"
                >
                  {isArabic ? 'ابحث عن فرصة عمل' : 'Find Your Next Gig'} →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── INTERACTIVE BOOKING ESTIMATOR ───────────────── */}
        <section id="estimator" className="relative overflow-hidden py-20 sm:py-24 bg-dark-900 border-y border-dark-700">
          <div className="absolute -top-40 -end-32 size-96 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-48 -start-32 size-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-14">
              <span className="section-tag mb-4 inline-flex">
                <Tag size={11} />
                {t('estimator_tag')}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-dark-50 mt-3">{t('estimator_title')}</h2>
              <p className="text-dark-300 mt-3 max-w-lg mx-auto text-sm sm:text-base">
                {t('estimator_desc')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
              {/* Calculator Inputs */}
              <div className="lg:col-span-7 bg-dark-950 border border-dark-600 p-5 sm:p-8 rounded-[28px] space-y-8 text-start shadow-[0_20px_60px_rgba(15,23,42,.08)]">

                {/* Event Type */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase text-dark-300 tracking-wide flex items-center gap-1.5">
                    <Tag size={13} className="text-primary-500" />
                    {t('select_service')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(rates).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEventType(key as 'exhibition' | 'gala' | 'conference' | 'banquet')}
                        aria-pressed={eventType === key}
                        className={`relative p-4 sm:p-5 rounded-2xl border text-start transition-all duration-200 cursor-pointer ${
                          eventType === key
                            ? 'bg-primary-500/10 border-primary-500 shadow-[0_10px_25px_rgba(249,115,22,.1)]'
                            : 'bg-dark-900 border-dark-600 hover:border-primary-300 hover:-translate-y-0.5'
                        }`}
                      >
                        <span className={`absolute top-4 end-4 size-2.5 rounded-full border-2 ${eventType === key ? 'bg-primary-500 border-primary-200' : 'bg-transparent border-dark-500'}`} />
                        <p className="font-bold text-sm text-dark-50 pe-6">{item.name}</p>
                        <p className="text-xs text-dark-300 mt-1.5 leading-relaxed">{item.desc}</p>
                        <p className={`text-xs font-bold mt-3 ${eventType === key ? 'text-primary-600' : 'text-primary-500'}`}>
                          {item.rate.toLocaleString()} EGP / {t('days').slice(0, 3)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Staff Count & Days */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-4 rounded-2xl bg-dark-900 border border-dark-600 p-4 sm:p-5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold uppercase text-dark-300 tracking-wide flex items-center gap-1.5">
                        <Users size={13} className="text-primary-500" />
                        {t('num_staff')}
                      </label>
                      <span className="text-xs font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                        {staffCount} {t('ushers')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={staffCount}
                      onChange={(e) => setStaffCount(parseInt(e.target.value))}
                      aria-label={t('num_staff')}
                      className="estimator-range w-full cursor-pointer"
                    />
                  </div>

                  <div className="space-y-4 rounded-2xl bg-dark-900 border border-dark-600 p-4 sm:p-5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold uppercase text-dark-300 tracking-wide flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-primary-500" />
                        {t('duration')}
                      </label>
                      <span className="text-xs font-semibold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                        {daysCount} {t('days')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={daysCount}
                      onChange={(e) => setDaysCount(parseInt(e.target.value))}
                      aria-label={t('duration')}
                      className="estimator-range w-full cursor-pointer"
                    />
                  </div>
                </div>

                {/* Uniform Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase text-dark-300 tracking-wide flex items-center gap-1.5">
                    <Info size={13} className="text-primary-500" />
                    {t('uniform_opt')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: 'formal', name: t('suit_tux'), note: t('std_free') },
                      { key: 'smart-casual', name: t('smart_casual'), note: t('std_free') },
                      { key: 'branded', name: t('branded_polo'), note: t('print_fee') },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setUniformOption(opt.key as 'formal' | 'smart-casual' | 'branded')}
                        aria-pressed={uniformOption === opt.key}
                        className={`p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                          uniformOption === opt.key
                            ? 'bg-primary-500/10 border-primary-500 shadow-[0_8px_20px_rgba(249,115,22,.08)]'
                            : 'bg-dark-900 border-dark-600 hover:border-primary-300'
                        }`}
                      >
                        <p className="font-semibold text-xs text-dark-50">{opt.name}</p>
                        <p className="text-[10px] text-dark-300 mt-0.5">{opt.note}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Column */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 bg-gradient-to-br from-[#1b2538] via-[#111827] to-[#09101d] text-white p-6 sm:p-8 rounded-[28px] shadow-[0_24px_70px_rgba(2,6,23,.28)] space-y-6 text-start relative overflow-hidden border border-white/10">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-amber-400" />
                <div className="absolute top-0 end-0 w-52 h-52 bg-primary-500/12 rounded-full blur-3xl" />

                <h3 className="font-bold text-base uppercase tracking-wide pb-3 border-b border-white/20 relative z-10">
                  {t('est_summary')}
                </h3>

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-white/80">{t('est_rate')}</span>
                    <span>{rates[eventType].rate.toLocaleString()} EGP / {t('days').slice(0, 3)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-white/80">{t('est_hired')}</span>
                    <span>{staffCount} {t('ushers')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-white/80">{t('est_duration')}</span>
                    <span>{daysCount} {t('days')}</span>
                  </div>
                  {uniformOption === 'branded' && (
                    <div className="flex justify-between text-sm font-medium text-primary-200">
                      <span>{t('est_polo')}</span>
                      <span>+{(staffCount * uniformFees.branded).toLocaleString()} EGP</span>
                    </div>
                  )}

                  <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-white/[.07] border border-white/10 flex justify-between items-end gap-4">
                    <div>
                      <p className="text-xs uppercase font-semibold text-white/60">{t('est_total')}</p>
                      <p className="text-3xl sm:text-4xl font-black tracking-tight mt-1 text-white">{totalEstimate.toLocaleString()} <span className="text-base text-primary-300">EGP</span></p>
                    </div>
                    <span className="text-[10px] font-medium bg-white/10 px-2 py-1 rounded-lg">
                      {t('vat_inc')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 relative z-10">
                  <button
                    onClick={() => router.push(`/register?role=provider&staff=${staffCount}&days=${daysCount}&type=${eventType}`)}
                    className="w-full bg-primary-500 hover:bg-primary-400 text-white font-black py-4 rounded-xl text-sm transition-all duration-200 cursor-pointer flex items-center justify-center shadow-[0_12px_28px_rgba(249,115,22,.3)] hover:-translate-y-0.5"
                  >
                    {t('lock_rate')}
                  </button>
                  <p className="text-[11px] text-white/50 text-center mt-3">{t('no_card')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── OPERATIONAL CHECKLIST ─────────────────────────── */}
        <section id="duties" className="py-20 bg-dark-900 border-y border-dark-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start text-start">

              {/* Left: Timeline */}
              <div className="space-y-6">
                <span className="section-tag inline-flex">
                  <Clock size={11} />
                  {t('duties_tag')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-dark-50 leading-tight">{t('duties_title')}</h2>
                <p className="text-dark-300 text-sm sm:text-base leading-relaxed">{t('duties_desc')}</p>

                <div className="space-y-3 pt-2">
                  {[
                    { time: t('time_1'), title: t('d_title_1'), desc: t('d_desc_1') },
                    { time: t('time_2'), title: t('d_title_2'), desc: t('d_desc_2') },
                    { time: t('time_3'), title: t('d_title_3'), desc: t('d_desc_3') },
                    { time: t('time_4'), title: t('d_title_4'), desc: t('d_desc_4') },
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 card-premium rounded-xl group hover:border-primary-200">
                      <div className="flex-shrink-0 text-xs font-semibold text-primary-500 bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200 self-start whitespace-nowrap">
                        {step.time}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-dark-50">{step.title}</h4>
                        <p className="text-xs text-dark-300 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Why Trust Us */}
              <div className="card-premium p-8 rounded-2xl space-y-6">
                <h3 className="font-bold text-lg text-dark-50">{t('trust_header')}</h3>

                <div className="space-y-5">
                  {[
                    { q: t('trust_q1'), a: t('trust_a1') },
                    { q: t('trust_q2'), a: t('trust_a2') },
                    { q: t('trust_q3'), a: t('trust_a3') },
                  ].map((pt, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={16} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-dark-50">{pt.q}</h4>
                        <p className="text-xs text-dark-300 mt-1 leading-relaxed">{pt.a}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-dark-800 border border-dark-600 rounded-xl flex items-center justify-between gap-4 mt-2">
                  <div>
                    <h4 className="font-semibold text-sm text-dark-50">{t('ready_to_hire')}</h4>
                    <p className="text-xs text-dark-300 mt-0.5">{t('reg_org')}</p>
                  </div>
                  <Button
                    onClick={() => router.push('/register?role=provider')}
                    size="sm"
                    className="font-semibold text-xs rounded-lg flex-shrink-0"
                  >
                    {t('create_org')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHY CHOOSE OO-USHERS ─────────────────────────── */}
        <section className="py-20 bg-dark-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="section-tag mb-4 inline-flex">
                <Award size={11} />
                {isArabic ? 'لماذا OO-Ushers' : 'Why OO-Ushers'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark-50 mt-3">
                {isArabic ? arCopy('طريقة أوضح لاختيار منظمي فعاليتك', 'طريقة أسهل تختار بيها أشرز إيفينتك') : 'A Clearer Way to Book Your Ushers'}
              </h2>
              <p className="text-dark-300 mt-3 max-w-xl mx-auto text-sm sm:text-base">
                {isArabic
                  ? arCopy('الأدوات الأساسية لإدارة الاختيار والحضور والتقييم', 'كل اللي محتاجه للاختيار والحضور والتقييم')
                  : 'The essentials for applications, attendance, ratings, and accountability'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
              {whyFeatures.map((feat) => (
                <div key={feat.title} className="card-premium p-6 rounded-2xl group">
                  <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <feat.icon size={22} className={feat.color} />
                  </div>
                  <h3 className="font-semibold text-dark-50 mb-2">{feat.title}</h3>
                  <p className="text-sm text-dark-300 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ SECTION ──────────────────────────────────── */}
        <section id="faq" className="py-20 bg-dark-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="section-tag mb-4 inline-flex">
                <MessageSquare size={11} />
                {isArabic ? 'الأسئلة الشائعة' : 'FAQ'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark-50 mt-3">{t('faq_title')}</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className={`card-premium rounded-xl overflow-hidden transition-all ${isOpen ? 'ring-1 ring-primary-200' : ''}`}>
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-start font-medium text-sm text-dark-50 hover:bg-dark-800 transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen
                        ? <ChevronUp size={16} className="text-primary-500 flex-shrink-0" />
                        : <ChevronDown size={16} className="text-dark-400 flex-shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-0 text-sm text-dark-300 leading-relaxed border-t border-dark-700">
                        <div className="pt-4">{faq.answer}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA SECTION ────────────────────────────── */}
        <section className="py-20 bg-dark-900 border-t border-dark-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="relative rounded-3xl overflow-hidden bg-accent-500 px-8 py-16 md:px-16">
              {/* Background pattern */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary-500/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
              </div>

              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-6">
                  <Sparkles size={11} />
                  {isArabic ? arCopy('ابدأ الآن مجاناً', 'ابدأ مجاناً دلوقتي') : 'Get Started Free'}
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                  {isArabic ? 'ابنِ فريق فعاليتك اليوم' : 'Build Your Event Team Today'}
                </h2>
                <p className="text-white/80 text-base max-w-xl mx-auto mb-8 leading-relaxed">
                  {t('banner_desc')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    id="final-find-staff"
                    onClick={() => router.push('/register?role=provider')}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-dark-800 text-accent-500 hover:text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg cursor-pointer"
                  >
                    {t('hire_staff_short')}
                    <ArrowRight size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
                  </button>
                  <button
                    id="final-join-staff"
                    onClick={() => router.push('/register?role=talent')}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl border border-primary-400 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  >
                    {t('apply_usher')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ───────────────────────────────────────── */}
        <footer className="bg-dark-950 border-t border-dark-700 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

              {/* Brand Column */}
              <div className="lg:col-span-1 space-y-4">
                <BrandLogo />
                <p className="text-sm text-dark-300 leading-relaxed max-w-xs">
                  {isArabic
                    ? 'منصة التوظيف الاحترافية لفعالياتك. اربط أفضل الكوادر مع أفضل الفرص.'
                    : 'The professional staffing marketplace for your events. Connect the best talent with the best opportunities.'}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  {[
                    { icon: Twitter, href: '#', label: 'Twitter' },
                    { icon: Linkedin, href: '#', label: 'LinkedIn' },
                    { icon: Instagram, href: '#', label: 'Instagram' },
                    { icon: Facebook, href: '#', label: 'Facebook' },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center text-dark-300 hover:text-primary-500 hover:border-primary-500/50 transition-all"
                    >
                      <Icon size={14} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Links: Platform */}
              <div className="space-y-4">
                <h4 className="font-semibold text-dark-50 text-sm">
                  {isArabic ? 'المنصة' : 'Platform'}
                </h4>
                <ul className="space-y-2.5">
                  {[
                    { label: isArabic ? 'الرئيسية' : 'Home', href: '/' },
                    { label: isArabic ? 'الفعاليات' : 'Events', href: '#estimator' },
                    { label: isArabic ? 'الموظفون' : 'Staff', href: '#' },
                    { label: isArabic ? 'الأسعار' : 'Pricing', href: '#estimator' },
                  ].map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-dark-300 hover:text-primary-500 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Links: Company */}
              <div className="space-y-4">
                <h4 className="font-semibold text-dark-50 text-sm">
                  {isArabic ? 'الشركة' : 'Company'}
                </h4>
                <ul className="space-y-2.5">
                  {[
                    { label: isArabic ? 'عن المنصة' : 'About', href: '#' },
                    { label: isArabic ? 'تواصل معنا' : 'Contact', href: '#' },
                    { label: isArabic ? 'الشروط والأحكام' : 'Terms of Service', href: '#' },
                    { label: isArabic ? 'سياسة الخصوصية' : 'Privacy Policy', href: '#' },
                  ].map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-dark-300 hover:text-primary-500 transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h4 className="font-semibold text-dark-50 text-sm">
                  {isArabic ? 'تواصل معنا' : 'Get in Touch'}
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0">
                      <Mail size={13} className="text-primary-500" />
                    </div>
                    <span className="text-sm text-dark-300">hello@oo-ushers.com</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0">
                      <MapPin size={13} className="text-primary-500" />
                    </div>
                    <span className="text-sm text-dark-300">
                      {isArabic ? 'القاهرة، مصر' : 'Cairo, Egypt'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-dark-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-dark-400">
                © {new Date().getFullYear()} OO-Ushers.{' '}
                {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
              </p>
              <div className="flex items-center gap-4">
                <a href="/terms" className="text-xs text-dark-400 hover:text-primary-500 transition-colors">
                  {isArabic ? 'الشروط' : 'Terms'}
                </a>
                <a href="/privacy" className="text-xs text-dark-400 hover:text-primary-500 transition-colors">
                  {isArabic ? 'الخصوصية' : 'Privacy'}
                </a>
                <a href="/cookies" className="text-xs text-dark-400 hover:text-primary-500 transition-colors">
                  {isArabic ? 'ملفات تعريف الارتباط' : 'Cookies'}
                </a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    );
  }

  return null;
}
