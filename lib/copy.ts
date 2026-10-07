'use client';

import { useLanguage } from '@/lib/i18n';

type Dict = Record<string, string>;

/** Screen-local copy in the three languages. 'ar-eg' falls back to 'ar', then 'en'. */
export function useCopy<T extends Dict>(copy: { en: T; ar: Partial<T>; 'ar-eg'?: Partial<T> }): T {
    const { language } = useLanguage();
    if (language === 'en') return copy.en;
    return { ...copy.en, ...copy.ar, ...(language === 'ar-eg' ? copy['ar-eg'] : {}) };
}
