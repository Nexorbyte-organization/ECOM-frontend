import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'signal';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

// `signal` is tungsten: for the one action per screen that should catch the eye, on dark fields.
const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-on-primary',
    secondary: 'bg-transparent hover:bg-dark-850 text-dark-50 border border-dark-500 hover:border-dark-100',
    ghost: 'bg-transparent hover:bg-dark-800 text-dark-200 hover:text-dark-50 border border-transparent',
    danger: 'bg-danger-500 hover:bg-danger-600 text-white',
    success: 'bg-success-500 hover:bg-success-600 text-white',
    signal: 'bg-accent-400 hover:bg-accent-300 text-[#0B1F1B]',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3.5 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
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
                'inline-flex min-h-10 items-center justify-center gap-2 font-semibold cursor-pointer whitespace-nowrap',
                'transition-colors duration-150 active:translate-y-px',
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
                <LoaderCircle aria-hidden="true" size={16} className="shrink-0 motion-safe:animate-spin" />
            ) : icon ? (
                <span className="flex-shrink-0">{icon}</span>
            ) : null}
            {children}
        </button>
    );
}
