import ContentSkeleton from '@/components/ui/Skeleton';
import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor, Bell, LogOut } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '@/lib/api';
import { AppNotification } from '@/types';
import LanguageDropdown from '@/components/shared/LanguageDropdown';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import BrandLogo from '@/components/shared/BrandLogo';
import { TopTabs } from '@/components/shared/WorkspaceNav';

interface NavbarProps {
    title?: string;
}

export default function Navbar({ title }: NavbarProps) {
    const { language, t } = useLanguage();
    const isArabic = language === 'ar' || language === 'ar-eg';
    const { theme, setTheme } = useTheme();
    const [themeOpen, setThemeOpen] = useState(false);

    const router = useRouter();
    const { user, logout } = useAuth();
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notificationBusy, setNotificationBusy] = useState(false);
    const [notifError, setNotifError] = useState('');
    const [signOutOpen, setSignOutOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const loadNotifs = useCallback(async () => {
        if (!user) return;
        try {
            const list = await getNotifications(user._id);
            setNotifications(list);
            setNotifError('');
        } catch (err) {
            setNotifError(err instanceof Error ? err.message : 'Could not load notifications.');
        } finally {
            setNotificationsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const timeout = window.setTimeout(loadNotifs, 0);

        const handleUpdate = () => {
            loadNotifs();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('usher_new_notification', handleUpdate);
            window.addEventListener('usher_notifications_updated', handleUpdate);
        }

        return () => {
            window.clearTimeout(timeout);
            if (typeof window !== 'undefined') {
                window.removeEventListener('usher_new_notification', handleUpdate);
                window.removeEventListener('usher_notifications_updated', handleUpdate);
            }
        };
    }, [user, loadNotifs]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleMarkAllRead = async () => {
        if (!user || notificationBusy) return;
        try {
                setNotificationBusy(true);
            await markAllNotificationsAsRead(user._id);
            setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
        } catch (err) {
            setNotifError(err instanceof Error ? err.message : 'Could not mark notifications as read.');
        } finally { setNotificationBusy(false); }
    };

    const handleClearAll = async () => {
        if (!user || notificationBusy) return;
        if (confirm(isArabic ? 'هل أنت متأكد من مسح جميع التنبيهات؟' : 'Are you sure you want to clear all notifications?')) {
            try {
                setNotificationBusy(true);
                await clearAllNotifications(user._id);
                setNotifications([]);
                setNotifOpen(false);
            } catch (err) {
                setNotifError(err instanceof Error ? err.message : 'Could not clear notifications.');
            } finally { setNotificationBusy(false); }
        }
    };

    const handleNotifClick = async (n: AppNotification) => {
        try {
            await markNotificationAsRead(n._id);
            setNotifOpen(false);
            if (n.link) router.push(n.link);
        } catch (err) {
            setNotifError(err instanceof Error ? err.message : 'Could not open notification.');
        }
    };

    const handleConfirmSignOut = async () => {
        setIsSigningOut(true);
        await logout();
        setIsSigningOut(false);
        setSignOutOpen(false);
        router.replace('/login');
    };

    // Dynamically match title to translation key if possible
    const getTranslatedTitle = (rawTitle?: string) => {
        if (!rawTitle) return '';
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
            'Events': 'nav_events'
        };
        const key = keyMap[rawTitle] || keyMap[rawTitle.replace('Search ', '').replace('Browse ', '')];
        return key ? t(key) : rawTitle;
    };

    const getThemeIcon = () => {
        if (theme === 'light') return <Sun size={14} className="text-dark-200" />;
        if (theme === 'dark') return <Moon size={14} className="text-dark-200" />;
        return <Monitor size={14} className="text-dark-200" />;
    };

    return (
        <header className="sticky top-0 z-30 h-[64px] bg-dark-950 border-b border-dark-600 px-3 sm:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-6">
                <BrandLogo href="/" />
                <TopTabs />
                {title && <h1 className="sr-only">{getTranslatedTitle(title)}</h1>}
            </div>

            <div className="flex items-center gap-2">
                {/* Theme Selector Dropdown */}
                <div className="relative hidden sm:block">
                    <button
                        onClick={() => setThemeOpen(!themeOpen)}
                        aria-label={`Select theme. Current theme: ${theme}`}
                        aria-expanded={themeOpen}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dark-500 bg-transparent hover:bg-dark-850 text-xs font-medium text-dark-200 transition-all cursor-pointer"
                        title={`Theme: ${theme}`}
                    >
                        {getThemeIcon()}
                        <span className="capitalize hidden sm:inline text-dark-200">
                            {theme === 'light' ? (isArabic ? 'فاتح' : 'Light') :
                             theme === 'dark' ? (isArabic ? 'داكن' : 'Dark') :
                             (isArabic ? 'تلقائي' : 'System')}
                        </span>
                    </button>

                    {themeOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                            <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-32 rounded-xl border border-dark-600 bg-dark-900 p-1.5 shadow-xl z-50 animate-scale-in">
                                {[
                                    { key: 'light', label: isArabic ? 'فاتح' : 'Light', icon: Sun },
                                    { key: 'dark', label: isArabic ? 'داكن' : 'Dark', icon: Moon },
                                    { key: 'system', label: isArabic ? 'تلقائي' : 'System', icon: Monitor },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isActive = theme === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => {
                                                setTheme(item.key as 'light' | 'dark' | 'system');
                                                setThemeOpen(false);
                                            }}
                                            className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-lg text-start font-medium cursor-pointer transition-colors ${
                                                isActive
                                                    ? 'bg-primary-500 text-on-primary'
                                                    : 'text-dark-200 hover:bg-dark-700'
                                            }`}
                                        >
                                            <Icon size={13} className={isActive ? 'text-on-primary' : 'text-dark-300'} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Notification Dropdown */}
                {user && (
                    <div className="relative">
                        <button
                            onClick={() => setNotifOpen(!notifOpen)}
                            aria-label={`${unreadCount} unread notifications`}
                            aria-expanded={notifOpen}
                            className="relative flex items-center justify-center p-2 rounded-lg border border-dark-500 bg-transparent hover:bg-dark-850 text-dark-200 transition-all cursor-pointer"
                            title="Notifications"
                        >
                            <Bell size={14} className="text-dark-200" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-400 text-[10px] font-bold text-[#0B1F1B] ring-2 ring-dark-950">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                                <div className="fixed left-3 right-3 top-[68px] sm:absolute sm:left-auto sm:right-0 rtl:sm:left-0 rtl:sm:right-auto sm:top-auto mt-2 sm:w-80 rounded-2xl border border-dark-600 bg-dark-900 shadow-2xl z-50 animate-scale-in flex flex-col max-h-[min(420px,70vh)]">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                                        <h3 className="text-xs font-bold text-dark-50 flex items-center gap-1.5">
                                            <Bell size={13} className="text-dark-300" />
                                            {isArabic ? 'التنبيهات' : 'Notifications'}
                                        </h3>
                                        <div className="flex gap-2">
                                            {unreadCount > 0 && (
                                                <button
                                                    disabled={notificationBusy} aria-busy={notificationBusy} onClick={handleMarkAllRead}
                                                    className="text-[10px] font-bold text-primary-400 hover:text-primary-300 hover:underline cursor-pointer"
                                                >
                                                    {isArabic ? 'تحديد الكل كمقروء' : 'Mark read'}
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button
                                                    disabled={notificationBusy} aria-busy={notificationBusy} onClick={handleClearAll}
                                                    className="text-[10px] font-bold text-danger-450 hover:text-danger-300 hover:underline cursor-pointer"
                                                >
                                                    {isArabic ? 'مسح الكل' : 'Clear all'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notifications List */}
                                    {notifError && <p role="alert" className="p-3 text-xs text-danger-400">{notifError}</p>}
                                    <div className="flex-1 overflow-y-auto divide-y divide-dark-800/60 max-h-[280px]">
                                        {notificationsLoading ? <ContentSkeleton variant="list" count={2} className="p-3" /> : notifError && notifications.length === 0 ? null : notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                                <Bell size={24} className="text-dark-600 mb-2" />
                                                <p className="text-xs text-dark-400 font-semibold">{isArabic ? 'لا توجد تنبيهات' : 'No notifications'}</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => {
                                                const typeColor = 
                                                    n.type === 'success' ? 'bg-success-500' :
                                                    n.type === 'warning' ? 'bg-warning-500' :
                                                    n.type === 'danger' ? 'bg-danger-500' : 'bg-primary-500';
                                                return (
                                                    <div
                                                        key={n._id}
                                                        onClick={() => handleNotifClick(n)}
                                                        className={`p-3 text-start hover:bg-dark-850 transition-colors cursor-pointer flex gap-2.5 ${
                                                            !n.isRead ? 'bg-primary-500/5' : ''
                                                        }`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColor}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-bold text-dark-100 truncate ${!n.isRead ? 'font-black' : ''}`}>
                                                                {n.title}
                                                            </p>
                                                            <p className="text-[11px] font-medium text-dark-350 mt-0.5 leading-normal">
                                                                {n.message}
                                                            </p>
                                                            <p className="text-[9px] text-dark-500 mt-1 font-semibold">
                                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <LanguageDropdown />

                {user && (
                    <button
                        onClick={() => setSignOutOpen(true)}
                        aria-label={t('sign_out')}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-600 bg-dark-800 text-dark-200 transition-all hover:bg-danger-500/10 hover:text-danger-400 hover:border-danger-500/40 cursor-pointer"
                        title={t('sign_out')}
                    >
                        <LogOut size={14} />
                    </button>
                )}
            </div>

            <Modal
                isOpen={signOutOpen}
                onClose={() => {
                    if (!isSigningOut) setSignOutOpen(false);
                }}
                title={t('sign_out')}
                className="max-w-sm"
            >
                <div className="space-y-4">
                    <p className="text-sm leading-6 text-dark-300">
                        {isArabic
                            ? 'هل أنت متأكد من تسجيل الخروج من حسابك؟'
                            : 'Are you sure you want to sign out of your account?'}
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setSignOutOpen(false)}
                            disabled={isSigningOut}
                            className="flex-1"
                        >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleConfirmSignOut}
                            isLoading={isSigningOut}
                            className="flex-1"
                        >
                            {t('sign_out')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </header>
    );
}
