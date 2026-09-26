import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-dark-800 text-dark-300 border-dark-700',
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-emerald-50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    warning: 'bg-amber-50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    danger: 'bg-red-50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',
    info: 'bg-blue-50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border',
                variantStyles[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
