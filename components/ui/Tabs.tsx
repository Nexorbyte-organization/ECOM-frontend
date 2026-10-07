'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string> { value: T; label: string; count?: number }

/** Underline tabs. The active one is ink with a green bar; counts stay quiet. */
export default function Tabs<T extends string>({ items, value, onChange, className, label }: {
    items: TabItem<T>[]; value: T; onChange: (value: T) => void; className?: string; label?: string;
}) {
    return (
        <div role="tablist" aria-label={label} className={cn('-mx-4 flex gap-7 overflow-x-auto overflow-y-hidden border-b border-edge px-4 sm:mx-0 sm:px-0', className)}>
            {items.map((item) => {
                const active = item.value === value;
                return (
                    <button key={item.value} role="tab" aria-selected={active} type="button" onClick={() => onChange(item.value)}
                        className={cn('relative shrink-0 cursor-pointer pb-3 text-[15px] font-semibold transition-colors', active ? 'text-dark-50' : 'text-dark-400 hover:text-dark-100')}>
                        {item.label}{item.count !== undefined && <span className="ms-1.5 text-xs font-medium tabular-nums text-dark-400">{item.count}</span>}
                        <span aria-hidden="true" className={cn('absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary-500 transition-transform duration-200', active ? 'scale-x-100' : 'scale-x-0')} />
                    </button>
                );
            })}
        </div>
    );
}
