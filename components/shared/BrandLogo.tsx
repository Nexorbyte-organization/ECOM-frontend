'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
    compact?: boolean;
    /** On a graphite field (auth panel, dark hero): light usher, bright teal guest. */
    inverted?: boolean;
    href?: string;
    className?: string;
}

// The two O's of the name are two people: the usher (left) and the guest (teal), joined by the
// usher's guiding arm. Colours come from theme tokens, so the mark follows light and dark mode:
// usher = strongest text colour (graphite / near-white), guest = primary teal.
function Mark({ inverted = false, className }: { inverted?: boolean; className?: string }) {
    const usher = inverted ? 'text-bottle-text' : 'text-dark-50';
    const guest = inverted ? 'text-accent-300' : 'text-primary-500';
    return (
        <svg viewBox="0 0 48 48" aria-hidden="true" className={cn('size-10 shrink-0', className)}>
            <g className={usher}>
                <circle cx="14" cy="14" r="6.5" fill="currentColor" />
                <path d="M7.5 28.5c4.5 9.5 14 12.5 23.5 8.6" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M27 32.2l5.3 4.9-6.3 3.5" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <circle className={guest} cx="34" cy="14" r="6.5" fill="currentColor" />
        </svg>
    );
}

export { Mark as BrandMark };

export default function BrandLogo({ compact = false, inverted = false, href, className }: BrandLogoProps) {
    const content = (
        <span className={cn('inline-flex items-center gap-2 select-none', className)}>
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
