'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface LanguageOption {
    code: string;
    label: string;
    flag: string;
    short: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'en',    label: 'English',           flag: '🇺🇸', short: 'EN' },
    { code: 'ar',    label: 'العربية الفصحى',     flag: '🇸🇦', short: 'AR' },
    { code: 'ar-eg', label: 'عربي مصري',           flag: '🇪🇬', short: 'مصري' },
];

interface LanguageDropdownProps {
    variant?: 'default' | 'outlined';
    className?: string;
}

export default function LanguageDropdown({ variant = 'default', className = '' }: LanguageDropdownProps) {
    const { language, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const baseBtn =
        variant === 'outlined'
            ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dark-50 bg-transparent hover:bg-dark-850 text-xs font-semibold text-dark-50 cursor-pointer transition-colors'
            : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-dark-500 bg-transparent hover:bg-dark-850 text-xs font-semibold text-dark-200 transition-colors cursor-pointer';

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                id="language-toggle"
                onClick={() => setOpen(!open)}
                className={baseBtn}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <Globe size={13} className="text-dark-300 flex-shrink-0" />
                <span className="hidden sm:inline">{current.flag} {current.short}</span>
                <ChevronDown
                    size={11}
                    className={`text-dark-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div
                        className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-44 rounded-xl border border-dark-600 bg-dark-900 p-1.5 shadow-xl z-50 animate-scale-in"
                        role="listbox"
                    >
                        {LANGUAGES.map((lang) => {
                            const isActive = language === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    role="option"
                                    aria-selected={isActive}
                                    onClick={() => { setLanguage(lang.code as 'en' | 'ar' | 'ar-eg'); setOpen(false); }}
                                    className={`flex items-center gap-2.5 w-full px-2.5 py-2 text-xs rounded-lg text-start font-medium cursor-pointer transition-colors ${
                                        isActive
                                            ? 'bg-primary-500 text-on-primary'
                                            : 'text-dark-200 hover:bg-dark-700'
                                    }`}
                                >
                                    <span className="text-base leading-none">{lang.flag}</span>
                                    <span className="flex-1">{lang.label}</span>
                                    {isActive && <Check size={11} className="flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
