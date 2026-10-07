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
                    className="fixed inset-0 bg-[#041512]/60 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 start-0 h-dvh w-[280px] z-50 flex flex-col',
                    'bg-bottle text-bottle-text border-e border-bottle-line',
                    'transition-transform duration-200 ease-out',
                    'lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:translate-x-0 lg:z-20',
                    isOpen
                        ? 'translate-x-0'
                        : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full'
                )}
            >
                {/* Logo area */}
                <div className="h-[76px] px-5 flex items-center relative border-b border-bottle-line">
                    <BrandLogo href="/" inverted />
                    <button
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="absolute top-4 end-4 lg:hidden p-1.5 rounded-md hover:bg-bottle-lift text-bottle-muted hover:text-bottle-text transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto" aria-label="Primary navigation">
                    {links.map((link) => {
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}/`));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'relative flex min-h-11 items-center gap-3 px-3.5 py-2.5 rounded-md text-sm transition-colors duration-150',
                                    isActive
                                        ? 'bg-bottle-lift text-white font-semibold'
                                        : 'text-bottle-muted hover:text-white hover:bg-bottle-lift/60 font-medium'
                                )}
                            >
                                {isActive && <span aria-hidden="true" className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-accent-400" />}
                                <link.icon size={17} className={isActive ? 'text-accent-400' : 'text-bottle-muted'} />
                                {getLinkLabel(link.label)}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-bottle-line">
                    <div className="flex items-center gap-3 px-2 py-2">
                        {(isTalent || isOrganizer) && !currentIdentity ? (
                            <SkeletonGroup className="shrink-0"><Skeleton className="h-8 w-8 rounded-full" /></SkeletonGroup>
                        ) : (
                            <Avatar src={currentIdentity?.photo} name={currentIdentity?.name || user?.fullName || user?.email || ''} size="sm" className="shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 text-start">
                            <p className="text-xs font-medium text-bottle-text truncate">{user?.email}</p>
                            <p className="text-xs text-bottle-muted capitalize mt-0.5">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900 border-t border-dark-600 lg:hidden" aria-label="Mobile navigation">
                <div className="flex items-center justify-around pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))]">
                    {links.slice(0, 5).map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors min-w-[56px]',
                                    isActive
                                        ? 'text-dark-50 font-semibold'
                                        : 'text-dark-400'
                                )}
                            >
                                {isActive && <span aria-hidden="true" className="absolute -top-2 inset-x-3 h-[3px] bg-accent-400" />}
                                <link.icon size={20} />
                                <span className="text-[10px]">
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
