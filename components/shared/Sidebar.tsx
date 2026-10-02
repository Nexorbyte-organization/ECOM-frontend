'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { getProviderProfileByUserId, getTalentProfileByUserId } from '@/lib/api';
import { PROFILE_UPDATED_EVENT } from '@/lib/profile-completion';
import Avatar from '@/components/ui/Avatar';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import BrandLogo from '@/components/shared/BrandLogo';
import {
    LayoutDashboard,
    User,
    Briefcase,
    CalendarDays,
    PlusCircle,
    Search,
    X,
    Users,
    Wallet,
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, isTalent, isOrganizer, isAdmin } = useAuth();
    const pathname = usePathname();
    const { t, dir } = useLanguage();
    const userId = user?._id;
    const accountKey = `${userId}:${user?.role}`;
    const [profileIdentity, setProfileIdentity] = useState<{ accountKey: string; photo?: string; name?: string } | null>(null);
    const currentIdentity = profileIdentity?.accountKey === accountKey ? profileIdentity : null;

    useEffect(() => {
        if (!userId || (!isTalent && !isOrganizer)) return;
        let active = true;
        let requestId = 0;
        const refreshIdentity = async () => {
            const currentRequest = ++requestId;
            try {
                const identity = isTalent
                    ? await getTalentProfileByUserId(userId).then((profile) => ({ photo: profile?.photo, name: profile?.fullName }))
                    : await getProviderProfileByUserId(userId).then((profile) => ({ photo: profile?.logo, name: profile?.companyName }));
                if (active && currentRequest === requestId) setProfileIdentity({ accountKey, ...identity });
            } catch {
                if (active && currentRequest === requestId) {
                    setProfileIdentity((current) => current?.accountKey === accountKey ? current : { accountKey });
                }
            }
        };
        const handleProfileUpdate = () => { void refreshIdentity(); };
        void refreshIdentity();
        window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
        return () => {
            active = false;
            window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
        };
    }, [accountKey, userId, isTalent, isOrganizer]);

    const talentLinks = [
        { href: '/talent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/talent/profile', label: 'My Profile', icon: User },
        { href: '/talent/jobs', label: 'Browse Jobs', icon: Briefcase },
        { href: '/talent/events', label: 'My Events', icon: CalendarDays },
    ];

    const providerLinks = [
        { href: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/provider/events', label: 'My Events', icon: CalendarDays },
        ...(isOrganizer ? [
            { href: '/provider/profile', label: 'Company Profile', icon: User },
            { href: '/provider/events/new', label: 'Create Event', icon: PlusCircle },
            { href: '/provider/staff', label: 'Manage Staff', icon: Users },
            { href: '/provider/payments', label: 'Payments', icon: Wallet },
        ] : []),
        { href: '/provider/talent', label: 'Search Talent', icon: Search },
    ];

    const adminLinks = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/events', label: 'Events', icon: CalendarDays },
        { href: '/admin/payments', label: 'Payments', icon: Wallet },
    ];

    const links = isAdmin ? adminLinks : isTalent ? talentLinks : providerLinks;

    const getLinkLabel = (label: string) => {
        const keyMap: Record<string, string> = {
            'Dashboard': 'nav_dashboard',
            'My Profile': 'nav_my_profile',
            'Browse Jobs': 'nav_browse_jobs',
            'My Events': 'nav_my_events',
            'Company Profile': 'nav_company_profile',
            'Create Event': 'nav_create_event',
            'Manage Staff': 'nav_manage_staff',
            'Search Talent': 'nav_search_talent',
            'Users': 'nav_users',
            'Events': 'nav_events',
            'Payments': 'nav_payments'
        };
        return t(keyMap[label] || label);
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-dark-50/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 start-0 h-dvh w-[280px] z-50 flex flex-col',
                    'bg-dark-900/95 backdrop-blur-xl border-e border-dark-700',
                    'shadow-[20px_0_50px_rgba(15,23,42,.08)]',
                    'transition-transform duration-300 ease-out',
                    'lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:translate-x-0 lg:z-20',
                    isOpen
                        ? 'translate-x-0'
                        : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full'
                )}
            >
                {/* Logo area */}
                <div className="h-[76px] px-5 flex items-center relative border-b border-dark-700">
                    <BrandLogo href="/" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 end-4 lg:hidden p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Primary navigation">
                    {links.map((link) => {
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}/`));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                className={cn(
                                    'flex min-h-11 items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-500 text-white font-bold shadow-[0_8px_20px_rgba(249,115,22,.22)]'
                                        : 'text-dark-300 hover:text-dark-50 hover:bg-dark-800 font-medium'
                                )}
                            >
                                <link.icon size={17} className={isActive ? 'text-white' : 'text-dark-400'} />
                                {getLinkLabel(link.label)}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-dark-700">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-dark-900">
                        {(isTalent || isOrganizer) && !currentIdentity ? (
                            <SkeletonGroup className="shrink-0"><Skeleton className="h-8 w-8 rounded-full" /></SkeletonGroup>
                        ) : (
                            <Avatar src={currentIdentity?.photo} name={currentIdentity?.name || user?.fullName || user?.email || ''} size="sm" className="shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 text-start">
                            <p className="text-xs font-medium text-dark-100 truncate">{user?.email}</p>
                            <p className="text-[10px] text-dark-400 capitalize mt-0.5">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/95 backdrop-blur-xl border-t border-dark-700 lg:hidden" aria-label="Mobile navigation">
                <div className="flex items-center justify-around pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))]">
                    {links.slice(0, 5).map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]',
                                    isActive
                                        ? 'text-primary-500'
                                        : 'text-dark-400'
                                )}
                            >
                                <link.icon size={20} />
                                <span className="text-[9px] font-medium">
                                    {link.label.replace('Company ', '').replace('Search ', '').replace('Browse ', '')}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
