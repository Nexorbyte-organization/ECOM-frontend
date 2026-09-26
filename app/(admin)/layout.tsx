'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, isLoading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || !isAdmin)) {
            router.replace('/login');
        }
    }, [user, isLoading, isAdmin, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-dark-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="min-w-0 flex-1 lg:ml-0">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8 pb-28 lg:pb-10">{children}</div>
            </main>
        </div>
    );
}
