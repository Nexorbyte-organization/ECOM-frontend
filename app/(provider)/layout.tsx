'use client';

import { PageSkeleton } from '@/components/ui/Skeleton';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import ProfileCompletionGate from '@/components/shared/ProfileCompletionGate';
import Button from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <div className="flex min-h-screen">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="min-w-0 flex-1 lg:ml-0">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                {user.actingAs && (
                    <div role="status" className="mx-4 mt-4 sm:mx-6 lg:mx-8 rounded-xl border border-warning-500 bg-warning-400/25 p-3 text-accent-700 shadow-sm dark:text-white">
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
                    <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8 pb-28 lg:pb-10">{children}</div>
                </ProfileCompletionGate>
            </main>
        </div>
    );
}
