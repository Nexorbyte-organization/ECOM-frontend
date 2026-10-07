'use client';

import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className, id, type, ...props }, ref) => {
        const [passwordVisible, setPasswordVisible] = useState(false);
        const { t } = useLanguage();
        const generatedId = useId();
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || generatedId;
        const errorId = useId();
        const isPassword = type === 'password';
        const toggleLabel = t(passwordVisible ? 'hide_password' : 'show_password');

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-dark-200">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full min-h-11 bg-dark-900 border border-dark-500 rounded-lg px-4 py-2.5 text-sm text-dark-50',
                            'placeholder:text-dark-400',
                            'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 focus:outline-none transition-[border-color,box-shadow] duration-150',
                            !!icon && 'pl-10',
                            isPassword && 'pe-12',
                            error && 'border-danger-500 focus:border-danger-500',
                            className
                        )}
                        {...props}
                        type={isPassword && passwordVisible ? 'text' : type}
                        aria-invalid={error ? true : props['aria-invalid']}
                        aria-describedby={error ? [props['aria-describedby'], errorId].filter(Boolean).join(' ') : props['aria-describedby']}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            className="absolute inset-y-0 end-2 flex min-w-9 items-center justify-center rounded-md text-dark-400 hover:text-dark-100"
                            onClick={() => setPasswordVisible((visible) => !visible)}
                            aria-label={toggleLabel}
                            aria-controls={inputId}
                            aria-pressed={passwordVisible}
                            title={toggleLabel}
                        >
                            {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                        </button>
                    )}
                </div>
                {error && <p id={errorId} role="alert" className="text-xs text-danger-500 mt-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
