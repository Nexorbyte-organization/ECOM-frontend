'use client';

import ContentSkeleton, { PageSkeleton } from '@/components/ui/Skeleton';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { Mail, Lock, Users, Building2 } from 'lucide-react';
import LanguageDropdown from '@/components/shared/LanguageDropdown';
import BrandLogo from '@/components/shared/BrandLogo';
import { cn, formatDate } from '@/lib/utils';
import { getReferralInvite } from '@/lib/api';
import { Event, TalentProfile } from '@/types';

function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'talent' | 'provider' | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();
    const { language, t } = useLanguage();
    const isArabic = language === 'ar' || language === 'ar-eg';
    const isEgyptian = language === 'ar-eg';
    
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('invite');

    const [inviteLoading, setInviteLoading] = useState(Boolean(inviteToken));
    const [referredEvent, setReferredEvent] = useState<Event | null>(null);
    const [referrerProfile, setReferrerProfile] = useState<TalentProfile | null>(null);

    useEffect(() => {
        if (inviteToken) {
            setRole('talent');
            getReferralInvite(inviteToken).then(({ event, referrer }) => {
                setReferredEvent(event);
                setReferrerProfile(referrer);
            }).catch((err) => setError(err instanceof Error ? err.message : 'This invite is no longer available')).finally(() => setInviteLoading(false));
        }
    }, [inviteToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!role) {
            setError(t('select_role_err'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('passwords_no_match'));
            return;
        }

        if (password.length < 8) {
            setError(t('password_short'));
            return;
        }

        setIsLoading(true);
        try {
            await register(email, password, role);
            if (inviteToken && role === 'talent') sessionStorage.setItem('usher_referral_invite', inviteToken);
            sessionStorage.setItem(
                'usher_registration_pending',
                isEgyptian
                    ? 'الحساب اتعمل. افتح الإيميل وفعّله، وبعد كده سجّل دخولك.'
                    : isArabic
                    ? 'تم إنشاء الحساب. افتح بريدك الإلكتروني وفعّل الحساب، ثم سجّل الدخول.'
                    : 'Account created. Open the verification email, then sign in.'
            );
            router.push('/login');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-bottle text-bottle-text">
                <div className="relative z-10 flex flex-col justify-center p-16 text-start">
                    <div className="mb-8 flex items-center justify-start">
                        <BrandLogo inverted />
                    </div>
                    <h1 className={`display text-white mb-5 ${isArabic ? 'text-5xl' : 'text-7xl'}`}>
                        {t('join_network')}
                    </h1>
                    <p className="text-lg text-bottle-muted max-w-md leading-relaxed">
                        {t('signup_intro')}
                    </p>
                </div>
            </div>

            {/* Right Panel - Register Form */}
            <div className="w-full lg:w-[54%] flex items-center justify-center px-5 py-24 sm:p-10 relative">
                
                <div className="absolute top-6 end-6 z-10">
                    <LanguageDropdown variant="outlined" />
                </div>

                <div className="w-full max-w-md animate-fade-in text-start">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <BrandLogo />
                    </div>

                                        <h2 className="display text-4xl sm:text-5xl text-dark-50 mb-3">{t('create_account')}</h2>
                    <p className="text-dark-300 mb-8">
                        {t('already_account')}{' '}
                        <Link href="/login" className="text-primary-500 font-semibold underline underline-offset-4 transition-colors">
                            {t('sign_in')}
                        </Link>
                    </p>

                    {inviteLoading && <ContentSkeleton variant="list" count={1} />}
                    {referredEvent && referrerProfile && (
                        <div className="mb-6 p-4 rounded-xl bg-dark-900 border border-dark-600 border-s-4 border-s-accent-400">
                            <div className="flex items-start gap-3">
                                <Avatar src={referrerProfile.photo} name={referrerProfile.fullName} size="md" className="shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-dark-300">{t('invited_tag')}</p>
                                    <p className="text-sm text-dark-200">
                                        <strong className="text-dark-100">{referrerProfile.fullName}</strong> {isEgyptian ? 'رشّحك تنضم لفريق الإيفينت!' : isArabic ? 'دعاك للانضمام إلى فريق العمل!' : 'invited you to join the usher team!'}
                                    </p>
                                    <div className="pt-2 mt-2 border-t border-dark-700/30">
                                        <p className="text-xs text-dark-400">{isEgyptian ? 'قدّم على شغل في:' : isArabic ? 'التقديم للعمل في:' : 'Apply to work at:'} <strong className="text-dark-100">{referredEvent.title}</strong></p>
                                        <p className="text-[11px] text-dark-500 mt-0.5">{isArabic ? 'الفئة:' : 'Category:'} {referredEvent.category} · {isArabic ? 'التاريخ:' : 'Date:'} {formatDate(referredEvent.eventDate)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-dark-300 mb-3">{t('i_want_to')}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('talent')}
                                className={cn(
                                    'p-4 rounded-lg border text-start transition-colors duration-150 cursor-pointer relative overflow-hidden',
                                    role === 'talent'
                                        ? 'border-primary-500 bg-dark-900'
                                        : 'border-dark-600 hover:border-dark-300'
                                )}
                            >
                                {referredEvent && (
                                    <span className="absolute top-0 end-0 bg-accent-400 text-[#0B1F1B] text-[10px] font-bold px-2 py-0.5 rounded-es-md">
                                        {t('invited_tag')}
                                    </span>
                                )}
                                <Users size={24} className={cn('mb-2', role === 'talent' ? 'text-primary-500' : 'text-dark-400')} />
                                <p className={cn('text-sm font-black', role === 'talent' ? 'text-primary-500' : 'text-dark-50')}>
                                    {t('find_work')}
                                </p>
                                <p className="text-xs text-dark-450 mt-1 font-semibold">{t('post_jobs_desc')}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('provider')}
                                className={cn(
                                    'p-4 rounded-lg border text-start transition-colors duration-150 cursor-pointer',
                                    role === 'provider'
                                        ? 'border-primary-500 bg-dark-900'
                                        : 'border-dark-600 hover:border-dark-300'
                                )}
                            >
                                <Building2 size={24} className={cn('mb-2', role === 'provider' ? 'text-primary-500' : 'text-dark-400')} />
                                <p className={cn('text-sm font-black', role === 'provider' ? 'text-primary-500' : 'text-dark-50')}>
                                    {t('hire_staff_short')}
                                </p>
                                <p className="text-xs text-dark-450 mt-1 font-semibold">{t('hire_talent_desc')}</p>
                            </button>
                        </div>
                    </div>

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

                        <Input
                            label={t('password')}
                            type="password"
                            placeholder={t('at_least_6')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Lock size={16} />}
                            required
                        />

                        <Input
                            label={t('confirm_password')}
                            type="password"
                            placeholder={t('re_enter_password')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            icon={<Lock size={16} />}
                            required
                        />

                        <Button type="submit" className="w-full font-semibold" size="lg" isLoading={isLoading}>
                            {t('create_account_btn')}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <RegisterForm />
        </Suspense>
    );
}
