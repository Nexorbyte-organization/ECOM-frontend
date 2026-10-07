'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, CalendarDays, Home, Plus, Search, Users, Wallet, User, Ticket as TicketIcon, MoreHorizontal, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface NavLink { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; also?: string[] }

const COPY = {
    en: { today: 'Today', gigs: 'Gigs', mine: 'My gigs', me: 'Me', desk: 'Desk', events: 'Events', talent: 'Ushers', staff: 'Staff', pay: 'Pay', company: 'Company', users: 'Users', newEvent: 'New event', more: 'More' },
    ar: { today: 'اليوم', gigs: 'الفرص', mine: 'فرصي', me: 'أنا', desk: 'المكتب', events: 'الفعاليات', talent: 'المنظمون', staff: 'الفريق', pay: 'المدفوعات', company: 'الشركة', users: 'المستخدمون', newEvent: 'فعالية جديدة', more: 'المزيد' },
    'ar-eg': { today: 'النهارده', gigs: 'الشغل', mine: 'شغلي', me: 'أنا', desk: 'المكتب', events: 'الإيفينتس', talent: 'الأشرز', staff: 'الفريق', pay: 'الفلوس', company: 'الشركة', users: 'اليوزرز', newEvent: 'إيفينت جديد', more: 'أكتر' },
} as const;

/** One place decides what each role can reach and what the big centre button does. */
export function useWorkspaceNav(): { links: NavLink[]; action: NavLink | null } {
    const { isAdmin, isTalent, isOrganizer } = useAuth();
    const { language } = useLanguage();
    const c = COPY[language];
    if (isAdmin) return { action: null, links: [
        { href: '/admin/dashboard', label: c.desk, icon: Home },
        { href: '/admin/users', label: c.users, icon: Users },
        { href: '/admin/events', label: c.events, icon: CalendarDays },
        { href: '/admin/payments', label: c.pay, icon: Wallet },
    ] };
    if (isTalent) return { action: null, links: [
        { href: '/talent/dashboard', label: c.today, icon: Home },
        { href: '/talent/jobs', label: c.gigs, icon: Briefcase },
        { href: '/talent/events', label: c.mine, icon: TicketIcon },
        { href: '/talent/profile', label: c.me, icon: User },
    ] };
    return {
        action: isOrganizer ? { href: '/provider/events/new', label: c.newEvent, icon: Plus } : null,
        links: [
            { href: '/provider/dashboard', label: c.desk, icon: Home },
            { href: '/provider/events', label: c.events, icon: CalendarDays },
            { href: '/provider/talent', label: c.talent, icon: Search },
            ...(isOrganizer ? [
                { href: '/provider/staff', label: c.staff, icon: Users },
                { href: '/provider/payments', label: c.pay, icon: Wallet },
                { href: '/provider/profile', label: c.company, icon: Building2 },
            ] : []),
        ],
    };
}

export const isActivePath = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** Desktop: text tabs; the active one carries a tungsten bar. */
export function TopTabs() {
    const { links } = useWorkspaceNav();
    const pathname = usePathname();
    return (
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                    <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}
                        className={cn('relative px-3.5 py-2 text-sm font-semibold transition-colors',
                            active ? 'text-dark-50' : 'text-dark-300 hover:text-dark-50')}>
                        {link.label}
                        {active && <span aria-hidden="true" className="absolute inset-x-3.5 -bottom-[13px] h-0.5 bg-primary-500" />}
                    </Link>
                );
            })}
        </nav>
    );
}

/** Phones: bottom bar. For organizers the middle slot is a raised punch that starts an event. */
export function BottomNav() {
    const { links, action } = useWorkspaceNav();
    const { language } = useLanguage();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const primary = action ? links.slice(0, 4) : links.slice(0, 4);
    const overflow = links.slice(4);
    const items = action ? [primary[0], primary[1], 'action', primary[2], overflow.length ? 'more' : primary[3]] : primary;
    const tab = (link: NavLink) => {
        const active = isActivePath(pathname, link.href);
        return (
            <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}
                className={cn('relative flex min-w-0 flex-1 flex-col items-center gap-0.5 pb-1 pt-2.5 text-[11px] font-semibold transition-colors', active ? 'text-primary-600 dark:text-primary-500' : 'text-dark-400')}>
                {active && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 bg-primary-500" />}
                <link.icon size={21} />
                <span className="max-w-full truncate">{link.label}</span>
            </Link>
        );
    };
    return (
        <>
            {open && <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)} />}
            {open && overflow.length > 0 && (
                <div className="fixed bottom-[78px] end-3 z-50 w-48 rounded-xl border border-dark-600 bg-dark-900 p-1.5 shadow-xl animate-scale-in md:hidden">
                    {overflow.map((link) => (
                        <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-dark-100 hover:bg-dark-850">
                            <link.icon size={18} className="text-dark-300" />{link.label}
                        </Link>
                    ))}
                </div>
            )}
            <nav aria-label="Primary" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-dark-600 bg-dark-900 md:hidden">
                <div className="flex items-end">
                    {items.map((item) => {
                        if (item === 'action' && action) {
                            return (
                                <Link key="action" href={action.href} aria-label={action.label}
                                    className="press -mt-6 flex flex-1 flex-col items-center gap-0.5 text-[11px] font-semibold text-dark-50">
                                    <span className="grid size-14 place-items-center rounded-full border-4 border-dark-900 bg-primary-500 text-on-primary shadow-md">
                                        <action.icon size={26} />
                                    </span>
                                </Link>
                            );
                        }
                        if (item === 'more') {
                            return (
                                <button key="more" type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
                                    className={cn('flex min-w-0 flex-1 flex-col items-center gap-0.5 pb-1 pt-2.5 text-[11px] font-semibold', open ? 'text-dark-50' : 'text-dark-400')}>
                                    <MoreHorizontal size={21} /><span>{COPY[language].more}</span>
                                </button>
                            );
                        }
                        return tab(item as NavLink);
                    })}
                </div>
            </nav>
        </>
    );
}
