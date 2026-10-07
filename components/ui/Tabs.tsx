'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string> { value: T; label: string; count?: number }

/** Big text tabs. The active one gets a highlighter stroke, like someone marked it with a pen. */
export default function Tabs<T extends string>({ items, value, onChange, className, label }: {
    items: TabItem<T>[]; value: T; onChange: (value: T) => void; className?: string; label?: string;
}) {
    return (
        <div role="tablist" aria-label={label} className={cn('-mx-4 flex gap-6 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
            {items.map((item) => {
                const active = item.value === value;
                return (
                    <button key={item.value} role="tab" aria-selected={active} type="button" onClick={() => onChange(item.value)}
                        className={cn('relative shrink-0 cursor-pointer pb-1 text-lg font-bold transition-colors sm:text-xl', active ? 'text-dark-50' : 'text-dark-400 hover:text-dark-100')}>
                        <span aria-hidden="true" className={cn('absolute inset-x-[-4px] bottom-1 -z-0 h-3 origin-left rounded-sm bg-accent-400 transition-transform duration-200', active ? 'scale-x-100' : 'scale-x-0')} />
                        <span className="relative">{item.label}{item.count !== undefined && <span className="ms-2 text-sm font-semibold tabular-nums opacity-60">{item.count}</span>}</span>
                    </button>
                );
            })}
        </div>
    );
}
