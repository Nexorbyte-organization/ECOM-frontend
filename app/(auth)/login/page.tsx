'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import LanguageDropdown from '@/components/shared/LanguageDropdown';
import BrandLogo from '@/components/shared/BrandLogo';
import { redeemReferralInvite, resendVerification } from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const [resending, setResending] = useState(false);
    const needsVerification = /not verified/i.test(error);

    const handleResendVerification = async () => {
        if (!email) return;
        setResending(true);
        try {
            const message = await resendVerification(email);
            setError('');
            setNotice(message);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Could not send the verification email');
        } finally {
            setResending(false);
        }
    };
    const { login } = useAuth();
    const router = useRouter();
    const { language, t } = useLanguage();
    const isArabic = language === 'ar' || language === 'ar-eg';
    const isEgyptian = language === 'ar-eg';

    useEffect(() => {
        const pending = sessionStorage.getItem('usher_registration_pending');
        if (pending) {
            setNotice(pending);
            sessionStorage.removeItem('usher_registration_pending');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            const inviteToken = sessionStorage.getItem('usher_referral_invite');
            if (inviteToken) {
                await redeemReferralInvite(inviteToken);
                sessionStorage.removeItem('usher_referral_invite');
            }
            const postLoginRedirect = sessionStorage.getItem('usher_post_login_redirect');
            if (postLoginRedirect?.startsWith('/talent/')) {
                sessionStorage.removeItem('usher_post_login_redirect');
                router.push(postLoginRedirect);
            } else {
                router.push('/');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-[#111827]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(249,115,22,.35),transparent_28%),linear-gradient(145deg,#111827_0%,#1e293b_52%,#101827_100%)]" />
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col justify-center p-16 text-start">
                    <div className="mb-8 flex items-center justify-start">
                        <BrandLogo inverted />
                    </div>
                    <h1 className="text-5xl font-black text-white mb-4">
                        {isEgyptian ? <>نورت<br />OO-Ushers</> : isArabic ? <>مرحباً بك في<br />OO-Ushers</> : <>Welcome to<br />OO-Ushers</>}
                    </h1>
                    <p className="text-lg text-white/70 max-w-md font-semibold">
                        {isEgyptian
                            ? 'المكان اللي بيجمع منظّمي الإيفينتس بأحسن ستاف. كوّن فريقك بسرعة، أو لاقي شغلك الجاي.'
                            : isArabic
                            ? 'المنصة الرائدة التي تجمع منظمي الفعاليات بالكوادر المحترفة. كوّن فريق عمل متكاملاً أو ابدأ مسيرتك في تنظيم الفعاليات.'
                            : 'The premier platform connecting event providers with talented workforce. Find the perfect talent or discover amazing opportunities.'}
                    </p>
                    <div className="mt-12 space-y-4 font-bold">
                        <div className="flex items-center gap-3 text-white/60">
                            <CheckCircle2 className="text-primary-400" size={20} />
                            <span>{isEgyptian ? 'شوف شغل الإيفينتس وقدّم عليه' : isArabic ? 'تصفح وتقدم لوظائف الفعاليات' : 'Browse and apply to event jobs'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60">
                            <CheckCircle2 className="text-primary-400" size={20} />
                            <span>{isEgyptian ? 'اشتغل مع أكبر شركات تنظيم الإيفينتس' : isArabic ? 'احصل على فرصتك مع كبرى وكالات التنظيم' : 'Get hired by top event companies'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60">
                            <CheckCircle2 className="text-primary-400" size={20} />
                            <span>{isEgyptian ? 'اثبت التزامك وعلّي تقييمك' : isArabic ? 'ابنِ سجل حضورك وارفع تقييمك' : 'Build your reputation & grow'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-[54%] flex items-center justify-center px-5 py-24 sm:p-10 relative">
                
                <div className="absolute top-6 start-6 z-10">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-600 bg-dark-900 hover:bg-dark-800 text-xs font-semibold text-dark-300 hover:text-dark-50 transition-all cursor-pointer"
                    >
                        <ArrowLeft size={13} className={isArabic ? 'rotate-180' : ''} />
                        <span className="hidden sm:inline">{isArabic ? 'الرئيسية' : 'Home'}</span>
                    </Link>
                </div>

                <div className="absolute top-6 end-6 z-10">
                    <LanguageDropdown variant="outlined" />
                </div>

                <div className="w-full max-w-md animate-fade-in text-start">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <BrandLogo />
                    </div>

                    <p className="section-tag mb-4">OO ACCESS</p>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-dark-50 mb-2">{t('sign_in_header')}</h2>
                    <p className="text-dark-400 mb-8 font-semibold">
                        {t('no_account')}{' '}
                        <Link href="/register" className="text-primary-500 hover:text-primary-400 transition-colors">
                            {t('create_one')}
                        </Link>
                    </p>

                    {notice && (
                        <div className="mb-6 flex items-start gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3 text-sm font-semibold text-success-500">
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                            <span>{notice}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm font-semibold">
                            {error}
                            {needsVerification && (
                                <button type="button" onClick={handleResendVerification} disabled={resending || !email}
                                    className="mt-2 block font-bold text-primary-500 underline disabled:opacity-60">
                                    {resending
                                        ? (isArabic ? 'جارٍ الإرسال…' : 'Sending…')
                                        : (isEgyptian ? 'ابعتلي لينك تفعيل تاني' : isArabic ? 'إعادة إرسال رابط التفعيل' : 'Resend verification email')}
                                </button>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label={t('email_addr')}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail size={16} />}
                            required
                        />

                        <div className="text-end -mt-2">
                            <Link href="/forgot-password" className="text-sm font-semibold text-primary-500 hover:text-primary-400">
                                {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                            </Link>
                        </div>

                        <Input
                            label={t('password')}
                            type="password"
                            placeholder={t('enter_password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Lock size={16} />}
                            required
                        />

                        <Button type="submit" className="w-full font-black py-3 rounded-xl" size="lg" isLoading={isLoading}>
                            {t('login')}
                        </Button>
                    </form>

                </div>
            </div>
        </div>
    );
}
