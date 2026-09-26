'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getProviderProfileByUserId, getTalentProfileByUserId } from '@/lib/api';
import {
    isProviderProfileComplete,
    isTalentProfileComplete,
    PROFILE_UPDATED_EVENT,
} from '@/lib/profile-completion';

type AccountType = 'talent' | 'provider';

interface ProfileCompletionContextValue {
    isComplete: boolean;
    isChecking: boolean;
    refresh: () => Promise<void>;
}

const ProfileCompletionContext = createContext<ProfileCompletionContextValue>({
    isComplete: false,
    isChecking: true,
    refresh: async () => undefined,
});

export function useProfileCompletion() {
    return useContext(ProfileCompletionContext);
}

export default function ProfileCompletionGate({
    accountType,
    children,
}: {
    accountType: AccountType;
    children: React.ReactNode;
}) {
    const { user, isTalent, isOrganizer } = useAuth();
    const { language } = useLanguage();
    const [isComplete, setIsComplete] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState('');
    const isArabic = language === 'ar' || language === 'ar-eg';
    const isEgyptian = language === 'ar-eg';

    const refresh = useCallback(async () => {
        if (!user) return;
        const shouldEnforce = accountType === 'talent' ? isTalent : isOrganizer;
        if (!shouldEnforce) {
            setIsComplete(true);
            setIsChecking(false);
            return;
        }
        setIsChecking(true);
        setError('');
        try {
            if (accountType === 'talent') {
                const profile = await getTalentProfileByUserId(user._id);
                setIsComplete(isTalentProfileComplete(profile));
            } else {
                const profile = await getProviderProfileByUserId(user._id);
                setIsComplete(isProviderProfileComplete(profile));
            }
        } catch (err) {
            setIsComplete(false);
            setError(err instanceof Error ? err.message : 'Could not check your profile.');
        } finally {
            setIsChecking(false);
        }
    }, [accountType, isOrganizer, isTalent, user]);

    useEffect(() => {
        const timeout = window.setTimeout(() => void refresh(), 0);
        const handleProfileUpdate = () => void refresh();
        window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
        };
    }, [refresh]);

    const profilePath = accountType === 'talent' ? '/talent/profile' : '/provider/profile';
    const title = isEgyptian
        ? accountType === 'talent' ? 'كمّل بروفايلك علشان تقدر تقدّم' : 'كمّل بروفايل الشركة علشان تبدأ تحجز'
        : isArabic
            ? accountType === 'talent' ? 'أكمل ملفك الشخصي قبل التقديم' : 'أكمل ملف الشركة قبل إنشاء الفعاليات'
            : accountType === 'talent' ? 'Complete your profile before applying' : 'Complete your company profile before booking';
    const description = isEgyptian
        ? 'تقدر تتفرج على المنصة والإيفينتس، بس مش هتقدر تعمل أي إجراء لحد ما تكمّل كل البيانات المطلوبة.'
        : isArabic
            ? 'يمكنك تصفح المنصة، لكن جميع الإجراءات ستظل متوقفة حتى تستكمل البيانات المطلوبة.'
            : 'You can browse the platform, but actions stay locked until all required profile details are complete.';
    const actionLabel = isEgyptian ? 'كمّل البروفايل' : isArabic ? 'إكمال الملف' : 'Complete profile';

    return (
        <ProfileCompletionContext.Provider value={{ isComplete, isChecking, refresh }}>
            {isChecking && <SkeletonGroup className="border-b border-dark-700 px-4 py-3"><Skeleton className="h-4 w-64 max-w-full" /></SkeletonGroup>}
            {error && <div role="alert" className="flex items-center justify-center gap-3 bg-danger-500/10 p-3 text-sm text-danger-400">{error}<button type="button" onClick={() => void refresh()} className="font-semibold underline">Retry</button></div>}
            {!isChecking && !isComplete && !error && (
                <div className="sticky top-0 z-30 border-b border-amber-500/30 bg-amber-50/95 px-4 py-3 shadow-sm backdrop-blur dark:bg-amber-950/90" role="alert">
                    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3 text-start">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                <AlertTriangle size={19} />
                            </span>
                            <div>
                                <p className="font-black text-amber-950 dark:text-amber-100">{title}</p>
                                <p className="mt-0.5 text-sm font-medium text-amber-800 dark:text-amber-200">{description}</p>
                            </div>
                        </div>
                        <Link href={profilePath} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700">
                            {actionLabel}
                            <ArrowRight size={16} className={isArabic ? 'rotate-180' : ''} />
                        </Link>
                    </div>
                </div>
            )}
            {children}
        </ProfileCompletionContext.Provider>
    );
}
