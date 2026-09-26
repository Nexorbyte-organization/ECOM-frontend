import React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-[0_8px_20px_rgba(249,115,22,.22)] hover:shadow-[0_10px_26px_rgba(249,115,22,.3)] hover:-translate-y-0.5 transition-all duration-200',
    secondary:
        'bg-dark-900 hover:bg-dark-800 text-dark-50 border border-dark-600 hover:border-primary-300 transition-all duration-200',
    ghost:
        'bg-transparent hover:bg-dark-800 text-dark-200 hover:text-dark-50 border border-transparent transition-all duration-200',
    danger:
        'bg-danger-500 hover:bg-danger-600 text-white shadow-sm hover:shadow-md transition-all duration-200',
    success:
        'bg-success-500 hover:bg-success-600 text-white shadow-sm hover:shadow-md transition-all duration-200',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading,
    icon,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex min-h-10 items-center justify-center gap-2 font-bold cursor-pointer whitespace-nowrap',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 focus:ring-offset-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            aria-busy={Boolean(isLoading)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span aria-hidden="true" className="h-4 w-4 rounded bg-current opacity-30 motion-safe:animate-pulse" />
            ) : icon ? (
                <span className="flex-shrink-0">{icon}</span>
            ) : null}
            {children}
        </button>
    );
}
