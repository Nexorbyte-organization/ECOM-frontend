'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: string; positive?: boolean };
    className?: string;
}

export default function StatsCard({ label, value, icon, trend, className }: StatsCardProps) {
    return (
        <div className={cn('glass rounded-xl p-5', className)}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-dark-300">{label}</p>
                <span className="text-dark-400" aria-hidden="true">{icon}</span>
            </div>
            <p className="display mt-3 text-5xl tabular-nums text-dark-50">{value}</p>
            {trend && (
                <p className={cn('mt-2 text-xs font-medium', trend.positive ? 'text-success-500' : 'text-danger-500')}>
                    {trend.value}
                </p>
            )}
        </div>
    );
}
