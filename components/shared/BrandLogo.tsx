import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
    compact?: boolean;
    inverted?: boolean;
    href?: string;
    className?: string;
}

function Mark({ inverted = false }: { inverted?: boolean }) {
    return (
        <span className="brand-mark" aria-hidden="true">
            <span className={cn('brand-mark-letter', inverted && 'text-white')}>O</span>
            <span className={cn('brand-mark-letter brand-mark-letter-accent', inverted && 'text-white')}>O</span>
            <span className="brand-mark-dot" />
        </span>
    );
}

export default function BrandLogo({ compact = false, inverted = false, href, className }: BrandLogoProps) {
    const content = (
        <span className={cn('inline-flex items-center gap-3 select-none', className)}>
            <Mark inverted={inverted} />
            {!compact && (
                <span className="flex flex-col text-start leading-none">
                    <span className={cn('text-[15px] font-black tracking-[-0.03em]', inverted ? 'text-white' : 'text-dark-50')}>
                        OO<span className="text-primary-500">—</span>USHERS
                    </span>
                    <span className={cn('mt-1 text-[8px] font-bold uppercase tracking-[0.2em]', inverted ? 'text-white/55' : 'text-dark-400')}>
                        People make the moment
                    </span>
                </span>
            )}
        </span>
    );

    return href ? <Link href={href} aria-label="OO-Ushers home">{content}</Link> : content;
}
