import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

// Status chips: a soft tint of the meaning colour with a dot. Green = good / done, sun = needs
// attention, coral = a problem, sky = information, grey = neutral.
const styles: Record<BadgeVariant, { chip: string; dot: string }> = {
    default: { chip: 'bg-dark-800 text-dark-200', dot: 'bg-dark-400' },
    primary: { chip: 'bg-primary-50 text-primary-600 dark:text-primary-300', dot: 'bg-primary-500' },
    success: { chip: 'bg-success-50 text-primary-600 dark:text-primary-300', dot: 'bg-success-500' },
    warning: { chip: 'bg-warning-50 text-accent-700 dark:text-accent-300', dot: 'bg-accent-450' },
    danger: { chip: 'bg-danger-50 text-danger-600 dark:text-danger-400', dot: 'bg-danger-500' },
    info: { chip: 'bg-info-50 text-info-600 dark:text-cat-sky-ink', dot: 'bg-info-500' },
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
    const s = styles[variant];
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium', s.chip, className)}>
            <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', s.dot)} />
            {children}
        </span>
    );
}
