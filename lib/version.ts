// Detects that a newer deployment replaced the build this tab was loaded from.
// Old tabs then fail to load removed chunks; we ask the user to refresh instead.
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';

let updateAvailable = false;
let pendingCheck: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function markUpdateAvailable() {
    if (updateAvailable) return;
    updateAvailable = true;
    listeners.forEach((listener) => listener());
}

export const versionStore = {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => updateAvailable,
    getServerSnapshot: () => false,
};

export function checkForNewVersion(): Promise<boolean> {
    if (typeof window === 'undefined' || APP_VERSION === 'dev') return Promise.resolve(false);
    if (updateAvailable) return Promise.resolve(true);
    pendingCheck ||= fetch(`/version?t=${Date.now()}`, { cache: 'no-store' })
        .then((response) => response.ok ? response.json() : null)
        .then((payload) => {
            const latest = typeof payload?.version === 'string' ? payload.version : '';
            if (latest && latest !== APP_VERSION) markUpdateAvailable();
            return updateAvailable;
        })
        .catch(() => false)
        .finally(() => { pendingCheck = null; });
    return pendingCheck;
}

const staleBuildPatterns = [
    /ChunkLoadError/i,
    /Loading (CSS )?chunk [\w-]+ failed/i,
    /Failed to load chunk/i,
    /Failed to fetch dynamically imported module/i,
    /Importing a module script failed/i,
    /error loading dynamically imported module/i,
    /Failed to find Server Action/i,
];

export function isStaleBuildError(error: unknown): boolean {
    if (!error) return false;
    const err = error as { name?: string; message?: string };
    const text = `${err.name || ''} ${err.message || String(error)}`;
    return staleBuildPatterns.some((pattern) => pattern.test(text));
}

// Treat a stale-build error as an update even if the version check cannot run.
export function reportPossibleStaleBuild(error: unknown): Promise<boolean> {
    if (isStaleBuildError(error)) {
        markUpdateAvailable();
        return Promise.resolve(true);
    }
    return checkForNewVersion();
}

export function reloadApp() {
    window.location.reload();
}

export const updateCopy = {
    en: { title: 'A new version is available', body: 'We just released an update. Please refresh to continue.', refresh: 'Refresh', errorTitle: 'Something went wrong', errorBody: 'Please refresh the page and try again.' },
    ar: { title: 'يتوفر إصدار جديد', body: 'تم إصدار تحديث جديد. يرجى تحديث الصفحة للمتابعة.', refresh: 'تحديث', errorTitle: 'حدث خطأ ما', errorBody: 'يرجى تحديث الصفحة والمحاولة مرة أخرى.' },
    'ar-eg': { title: 'فيه نسخة جديدة', body: 'نزلنا تحديث جديد. اعمل ريفريش للصفحة عشان تكمل.', refresh: 'ريفريش', errorTitle: 'حصلت مشكلة', errorBody: 'اعمل ريفريش للصفحة وجرب تاني.' },
} as const;

export type UpdateLanguage = keyof typeof updateCopy;

// Error boundaries may render outside LanguageProvider, so read the stored preference directly.
export function storedLanguage(): UpdateLanguage {
    if (typeof window === 'undefined') return 'en';
    try {
        const stored = localStorage.getItem('usher_lang');
        if (stored === 'en' || stored === 'ar' || stored === 'ar-eg') return stored;
    } catch { /* storage unavailable */ }
    return navigator.language?.split('-')[0] === 'ar' ? 'ar' : 'en';
}
