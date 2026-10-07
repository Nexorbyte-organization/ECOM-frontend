'use client';

import { PageSkeleton } from '@/components/ui/Skeleton';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { BottomNav } from '@/components/shared/WorkspaceNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAdmin, isProvider } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || !isAdmin)) {
            router.replace(isProvider ? '/provider/dashboard' : '/login');
        }
    }, [user, isLoading, isAdmin, isProvider, router]);

    if (isLoading || !user || !isAdmin) {
        return <PageSkeleton workspace />;
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:py-10 pb-32 md:pb-12">{children}</div>
            <BottomNav />
        </div>
    );
}
