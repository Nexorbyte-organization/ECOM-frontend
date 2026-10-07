'use client';

import Link from 'next/link';
import { useId } from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
    compact?: boolean;
    inverted?: boolean;
    href?: string;
    className?: string;
}

// Two O's punched out of a ticket stub, with the tear notches top and bottom.
function Mark({ inverted = false, className }: { inverted?: boolean; className?: string }) {
    const maskId = useId();
    return (
        <svg viewBox="0 0 48 28" aria-hidden="true" className={cn('h-[26px] w-[44px] shrink-0', inverted ? 'text-bottle-text' : 'text-primary-500', className)}>
            <defs>
                <mask id={maskId}>
                    <rect width="48" height="28" fill="#fff" />
                    <circle cx="14" cy="14" r="6.5" fill="#000" />
                    <circle cx="34" cy="14" r="6.5" fill="#000" />
                    <circle cx="24" cy="0" r="2.6" fill="#000" />
                    <circle cx="24" cy="28" r="2.6" fill="#000" />
                </mask>
            </defs>
            <rect width="48" height="28" rx="4" fill="currentColor" mask={`url(#${maskId})`} />
        </svg>
    );
}

export { Mark as BrandMark };

export default function BrandLogo({ compact = false, inverted = false, href, className }: BrandLogoProps) {
    const content = (
        <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
            <Mark inverted={inverted} />
            {!compact && (
                <span dir="ltr" className={cn('display text-[22px] leading-none', inverted ? 'text-bottle-text' : 'text-dark-50')}>
                    ushers
                </span>
            )}
        </span>
    );

    return href ? <Link href={href} aria-label="OO-Ushers home">{content}</Link> : content;
}
