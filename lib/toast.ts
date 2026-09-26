export type ToastMessage = string | { en: string; ar: string; 'ar-eg'?: string };
export type ToastTone = 'success' | 'error' | 'info';
export interface ToastNotice { id: number; message: ToastMessage; tone: ToastTone }
let notices: ToastNotice[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const empty: ToastNotice[] = [];
const recent = new Map<string, number>();
function publish() { listeners.forEach((listener) => listener()); }
function show(message: ToastMessage, tone: ToastTone) {
    if (typeof window === 'undefined') return;
    const key = `${tone}:${JSON.stringify(message)}`;
    const now = Date.now();
    for (const [entry, time] of recent) if (now - time > 1500) recent.delete(entry);
    if (recent.has(key)) return;
    recent.set(key, now);
    notices = [...notices, { id: ++nextId, message, tone }].slice(-3);
    publish();
}
export const toast = {
    success: (message: ToastMessage) => show(message, 'success'),
    error: (message: ToastMessage) => show(message, 'error'),
    info: (message: ToastMessage) => show(message, 'info'),
    dismiss: (id: number) => { notices = notices.filter((notice) => notice.id !== id); publish(); },
};
export const toastStore = {
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => notices,
    getServerSnapshot: () => empty,
};

// Report only a completed logical action, including any follow-up image upload.
// Reads and background polling stay quiet; callers still receive errors for inline feedback.
export function withFeedback<Args extends unknown[], Result>(
    action: (...args: Args) => Promise<Result>, success: ToastMessage,
): (...args: Args) => Promise<Result> {
    return async (...args) => {
        try {
            const result = await action(...args);
            toast.success(success);
            return result;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : {
                en: 'Something went wrong. Please try again.', ar: 'حدث خطأ. يرجى المحاولة مرة أخرى.', 'ar-eg': 'حصل خطأ. جرّب تاني.',
            });
            throw error;
        }
    };
}
