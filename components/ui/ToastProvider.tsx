'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { toast, toastStore, ToastNotice } from '@/lib/toast';

function ToastItem({ notice }: { notice: ToastNotice }) {
    const { language } = useLanguage();
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    useEffect(() => {
        if (hovered || focused) return;
        const timeout = window.setTimeout(() => toast.dismiss(notice.id), notice.tone === 'error' ? 8000 : 5000);
        return () => window.clearTimeout(timeout);
    }, [notice.id, notice.tone, hovered, focused]);
    const message = typeof notice.message === 'string' ? notice.message : notice.message[language] || notice.message.ar;
    const Icon = notice.tone === 'success' ? CheckCircle2 : notice.tone === 'error' ? CircleAlert : Info;
    const color = notice.tone === 'success' ? 'text-success-500' : notice.tone === 'error' ? 'text-danger-500' : 'text-primary-500';
    return (
        <div role={notice.tone === 'error' ? 'alert' : 'status'} aria-atomic="true"
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-dark-700 bg-dark-900 p-4 text-start text-dark-50 shadow-xl">
            <Icon size={20} className={`mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
            <p className="min-w-0 flex-1 break-words text-sm font-semibold">{message}</p>
            <button type="button" onClick={() => toast.dismiss(notice.id)} aria-label={language === 'en' ? 'Dismiss notification' : 'إغلاق التنبيه'}
                className="shrink-0 rounded-lg p-1 text-dark-400 hover:bg-dark-800 hover:text-dark-50 focus-visible:outline-2 focus-visible:outline-primary-500">
                <X size={16} aria-hidden="true" />
            </button>
        </div>
    );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const notices = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getServerSnapshot);
    const { dir } = useLanguage();
    return <>{children}<div dir={dir} className="pointer-events-none fixed bottom-4 end-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {notices.map((notice) => <ToastItem key={notice.id} notice={notice} />)}
    </div></>;
}
