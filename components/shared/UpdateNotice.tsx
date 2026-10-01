'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { RefreshCw, Sparkles, CircleAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
    checkForNewVersion, reloadApp, reportPossibleStaleBuild, storedLanguage,
    updateCopy, UpdateLanguage, versionStore,
} from '@/lib/version';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

function useStoredLanguage() {
    const [language, setLanguage] = useState<UpdateLanguage>('en');
    useEffect(() => { queueMicrotask(() => setLanguage(storedLanguage())); }, []);
    return { copy: updateCopy[language], dir: language === 'en' ? 'ltr' as const : 'rtl' as const };
}

// Floating notice for open tabs: checks on focus, periodically, and after chunk-load failures.
export function UpdateBanner() {
    const updateAvailable = useSyncExternalStore(versionStore.subscribe, versionStore.getSnapshot, versionStore.getServerSnapshot);
    const { copy, dir } = useStoredLanguage();

    useEffect(() => {
        const check = () => { if (document.visibilityState === 'visible') void checkForNewVersion(); };
        const onError = (event: ErrorEvent) => { void reportPossibleStaleBuild(event.error ?? event.message); };
        const onRejection = (event: PromiseRejectionEvent) => { void reportPossibleStaleBuild(event.reason); };
        const interval = window.setInterval(check, CHECK_INTERVAL_MS);
        document.addEventListener('visibilitychange', check);
        window.addEventListener('focus', check);
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', check);
            window.removeEventListener('focus', check);
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, []);

    if (!updateAvailable) return null;
    return (
        <div dir={dir} role="status" aria-live="polite"
            className="fixed inset-x-4 top-4 z-[110] mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-2xl border border-primary-300 bg-dark-900 p-4 text-start text-dark-50 shadow-xl sm:flex-nowrap">
            <Sparkles size={20} className="shrink-0 text-primary-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{copy.title}</p>
                <p className="text-xs text-dark-300">{copy.body}</p>
            </div>
            <Button size="sm" onClick={reloadApp} icon={<RefreshCw size={14} aria-hidden="true" />}>{copy.refresh}</Button>
        </div>
    );
}

// Full-page replacement for the default error screen used by the App Router error boundaries.
export function UpdateErrorScreen({ error }: { error: Error }) {
    const updateAvailable = useSyncExternalStore(versionStore.subscribe, versionStore.getSnapshot, versionStore.getServerSnapshot);
    const [checked, setChecked] = useState(false);
    const { copy, dir } = useStoredLanguage();

    useEffect(() => {
        let active = true;
        void reportPossibleStaleBuild(error).finally(() => { if (active) setChecked(true); });
        return () => { active = false; };
    }, [error]);

    if (!checked && !updateAvailable) return <div className="min-h-screen bg-dark-950" />;
    const Icon = updateAvailable ? Sparkles : CircleAlert;
    return (
        <main dir={dir} className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
            <div className="w-full max-w-md rounded-3xl border border-dark-700 bg-dark-900 p-8 text-center text-dark-50 shadow-xl">
                <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                    <Icon size={28} aria-hidden="true" />
                </span>
                <h1 className="text-xl font-bold">{updateAvailable ? copy.title : copy.errorTitle}</h1>
                <p className="mt-2 text-sm text-dark-300">{updateAvailable ? copy.body : copy.errorBody}</p>
                <Button className="mt-6" onClick={reloadApp} icon={<RefreshCw size={16} aria-hidden="true" />}>{copy.refresh}</Button>
            </div>
        </main>
    );
}
