'use client';

import { PageSkeleton } from '@/components/ui/Skeleton';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/shared/Navbar';
import { BottomNav } from '@/components/shared/WorkspaceNav';
import ProfileCompletionGate from '@/components/shared/ProfileCompletionGate';
import Button from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isProvider, isAdmin, stopActingAsOrganization } = useAuth();
    const [stopping, setStopping] = useState(false);
    const [stopError, setStopError] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || !isProvider)) {
            router.replace(isAdmin ? '/admin/dashboard' : '/login');
        }
    }, [user, isLoading, isProvider, isAdmin, router]);

    const stopActing = async () => {
        setStopping(true);
        setStopError('');
        try {
            await stopActingAsOrganization();
            router.replace('/admin/dashboard');
        } catch (error) {
            setStopError(error instanceof Error ? error.message : 'Could not return to admin dashboard.');
        } finally {
            setStopping(false);
        }
    };

    if (isLoading || !user || !isProvider) {
        return <PageSkeleton workspace />;
    }

    return (
        <div className="min-h-screen">
            <Navbar />
                {user.actingAs && (
                    <div role="status" className="mx-4 mt-4 sm:mx-6 lg:mx-8 rounded-lg border border-warning-500 bg-warning-400/25 p-3 text-accent-700 dark:text-white">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-2 text-sm font-semibold">
                                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-accent-700 dark:text-white" aria-hidden="true" />
                                <span>Warning: You are an admin acting as {user.actingAs.organizationName} owner.</span>
                            </div>
                            <Button type="button" variant="secondary" size="sm" onClick={stopActing} isLoading={stopping}>
                                Stop and return to admin dashboard
                            </Button>
                        </div>
                        {stopError && <p role="alert" className="mt-2 text-sm text-danger-400">{stopError}</p>}
                    </div>
                )}
            <ProfileCompletionGate accountType="provider">
                <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:py-10 pb-32 md:pb-12">{children}</div>
            </ProfileCompletionGate>
            <BottomNav />
        </div>
    );
}
