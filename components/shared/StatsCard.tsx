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
        <div className={cn('glass rounded-2xl p-5 group hover:border-primary-300 transition-all duration-300', className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-dark-400 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-dark-50">{value}</p>
                    {trend && (
                        <p className={cn('text-xs font-medium', trend.positive ? 'text-success-500' : 'text-danger-500')}>
                            {trend.value}
                        </p>
                    )}
                </div>
                <div className="p-2.5 rounded-xl bg-primary-50 text-primary-500 group-hover:bg-primary-100 transition-colors">
                    {icon}
                </div>
            </div>
        </div>
    );
}
