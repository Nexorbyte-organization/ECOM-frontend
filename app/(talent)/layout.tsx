'use client';

import { PageSkeleton } from '@/components/ui/Skeleton';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { BottomNav } from '@/components/shared/WorkspaceNav';
import ProfileCompletionGate from '@/components/shared/ProfileCompletionGate';

export default function TalentLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isTalent } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || !isTalent)) {
            const destination = `${window.location.pathname}${window.location.search}`;
            if (destination.startsWith('/talent/check-in/')) {
                sessionStorage.setItem('usher_post_login_redirect', destination);
            }
            router.replace('/login');
        }
    }, [user, isLoading, isTalent, router]);

    if (isLoading || !user) {
        return <PageSkeleton workspace />;
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <ProfileCompletionGate accountType="talent">
                    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:py-10 pb-32 md:pb-12">{children}</div>
            </ProfileCompletionGate>
            <BottomNav />
        </div>
    );
}
