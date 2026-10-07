'use client';

import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
    title: string;
    /** One quiet line shown under the title, so a closed section still says what is inside. */
    summary?: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    className?: string;
}

/** A section that folds away. The header is the button; the body animates its height. */
export default function Collapsible({ title, summary, defaultOpen = false, children, className }: CollapsibleProps) {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = useId();
    return (
        <section className={cn('rounded-xl border border-edge bg-dark-900', className)}>
            <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl p-5 text-start">
                <span className="min-w-0">
                    <span className="display-sm block text-lg text-dark-50">{title}</span>
                    {summary && <span className="mt-0.5 block text-sm text-dark-300">{summary}</span>}
                </span>
                <ChevronDown size={20} aria-hidden="true" className={cn('shrink-0 text-dark-400 transition-transform duration-200', open && 'rotate-180')} />
            </button>
            <div id={panelId} role="region" aria-label={title} className={cn('grid transition-[grid-template-rows] duration-200 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden">
                    <div className="px-5 pb-5" inert={!open}>{children}</div>
                </div>
            </div>
        </section>
    );
}
