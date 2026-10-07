import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TicketTone, toneTint, toneText } from '@/lib/ticket';

/** The date of an event: a day numeral on a soft tint of its category colour. */
export function DateBlock({ date, tone, className }: { date: string; tone: TicketTone; className?: string }) {
    const d = new Date(`${date.slice(0, 10)}T00:00:00`);
    return (
        <div className={cn('flex size-[60px] shrink-0 flex-col items-center justify-center rounded-xl', toneTint[tone], toneText[tone], className)}>
            <span className="display text-[1.65rem] leading-none tabular-nums">{d.getDate()}</span>
            <span className="mt-0.5 text-xs font-semibold">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
        </div>
    );
}

/** Staffing as a quiet bar and a count. Teal when full, amber while it fills, neutral when empty. */
export function FillBar({ filled, total, className }: { filled: number; total: number; className?: string }) {
    const pct = total ? Math.min(100, Math.round((filled / total) * 100)) : 0;
    return (
        <span className={cn('inline-flex items-center gap-2.5', className)} role="img" aria-label={`${filled}/${total}`}>
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-dark-700" aria-hidden="true">
                <span className={cn('block h-full rounded-full', pct >= 100 ? 'bg-primary-500' : 'bg-warning-500')} style={{ width: `${pct}%` }} />
            </span>
            <span className="text-xs font-semibold tabular-nums text-dark-300">{filled}/{total}</span>
        </span>
    );
}

/** Kept so older screens still compile; same quiet bar. */
export const FillDots = FillBar;

/** One grouped surface for a list of rows. Rows are divided by hairlines, not boxed one by one. */
export function RowList({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn('divide-y divide-edge overflow-hidden rounded-xl border border-edge bg-dark-900', className)}>{children}</div>;
}

interface RowProps { href?: string; children: React.ReactNode; leading?: React.ReactNode; className?: string }
/** A row inside a RowList: leading block, content, optional trailing slot. */
export default function Row({ href, children, leading, className }: RowProps) {
    const inner = (<>{leading}<div className="min-w-0 flex-1">{children}</div></>);
    const classes = cn('press flex items-start gap-4 p-4 sm:p-5', href && 'hover:bg-dark-850', className);
    return href ? <Link href={href} className={classes}>{inner}</Link> : <div className={classes}>{inner}</div>;
}
