import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

// Status reads like a punched ticket: a hollow hole means not yet, a filled one means done.
// Tungsten is attention (late, waiting on you); red is a problem.
const markerStyles: Record<BadgeVariant, string> = {
    default: 'border-dark-400',
    info: 'border-primary-500',
    primary: 'border-primary-500 bg-primary-500',
    success: 'border-success-500 bg-success-500',
    warning: 'border-accent-400 bg-accent-400',
    danger: 'border-danger-500 bg-danger-500',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border-[1.5px] border-edge bg-dark-900 text-dark-50',
                className
            )}
        >
            <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full border-[1.5px]', markerStyles[variant])} />
            {children}
        </span>
    );
}
