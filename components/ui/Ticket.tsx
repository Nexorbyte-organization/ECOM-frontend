import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TicketTone, toneBg } from '@/lib/ticket';

/** The date half of a ticket: a big day numeral on a loud colour. */
export function DateStub({ date, tone, className }: { date: string; tone: TicketTone; className?: string }) {
    const d = new Date(`${date.slice(0, 10)}T00:00:00`);
    return (
        <div className={cn('flex w-[84px] shrink-0 flex-col items-center justify-center px-2 py-4 text-ticket-ink', toneBg[tone], className)}>
            <span className="display text-[2.75rem] leading-none tabular-nums">{d.getDate()}</span>
            <span className="mt-1.5 text-sm font-semibold">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
            <span className="text-xs opacity-75">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
        </div>
    );
}

/** Staffing as punched dots: filled = booked, hollow = still open. Past 12 it becomes a count. */
export function FillDots({ filled, total, className }: { filled: number; total: number; className?: string }) {
    const label = `${filled}/${total}`;
    if (total > 12) {
        return <span className={cn('display-sm text-lg tabular-nums text-dark-50', className)}>{label}</span>;
    }
    return (
        <span className={cn('inline-flex items-center gap-2', className)} role="img" aria-label={label}>
            <span className="flex flex-wrap gap-[3px]" aria-hidden="true">
                {Array.from({ length: total }, (_, i) => (
                    <span key={i} className={cn('size-2.5 rounded-full border-[1.5px]', i < filled ? 'border-dark-50 bg-dark-50' : 'border-dark-400')} />
                ))}
            </span>
            <span className="text-xs font-semibold tabular-nums text-dark-300">{label}</span>
        </span>
    );
}

interface TicketProps {
    date: string;
    tone: TicketTone;
    href?: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    /** Page colour behind the ticket so the notches match; defaults to the page background. */
    bg?: string;
}

/** An event as a ticket: stub + perforation + body. Whole thing is the link when `href` is set. */
export default function Ticket({ date, tone, href, children, className, onClick, bg }: TicketProps) {
    const inner = (
        <>
            <DateStub date={date} tone={tone} />
            <div className="ticket-body bg-dark-900 p-4 sm:p-5">{children}</div>
        </>
    );
    const classes = cn('ticket press', className);
    const style = bg ? ({ '--ticket-bg': bg } as React.CSSProperties) : undefined;
    return href
        ? <Link href={href} className={classes} style={style}>{inner}</Link>
        : <div className={classes} style={style} onClick={onClick}>{inner}</div>;
}
