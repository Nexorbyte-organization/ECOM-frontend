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
// Sticker buttons: ink outline, hard offset shadow that collapses when pressed.
const sticker = 'border-2 border-edge shadow-[3px_3px_0_0_var(--color-edge)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none';
const variantStyles: Record<ButtonVariant, string> = {
    primary: `bg-accent-400 hover:bg-accent-300 text-[#0B1F1B] ${sticker}`,
    secondary: `bg-dark-900 hover:bg-dark-850 text-dark-50 ${sticker}`,
    ghost: 'bg-transparent hover:bg-dark-800 text-dark-200 hover:text-dark-50 border-2 border-transparent',
    danger: `bg-danger-500 hover:bg-danger-450 text-white ${sticker}`,
    success: `bg-ticket-mint hover:bg-[#6BECB5] text-[#0B1F1B] ${sticker}`,
    signal: `bg-accent-400 hover:bg-accent-300 text-[#0B1F1B] ${sticker}`,
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
                'transition-[transform,box-shadow,background-color] duration-100',
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
