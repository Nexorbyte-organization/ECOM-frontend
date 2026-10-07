import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import Row, { DateBlock, FillBar } from '@/components/ui/Ticket';
import { toneFor, toneDot } from '@/lib/ticket';
import { Event } from '@/types';
import { formatEventHours } from '@/lib/utils';

interface EventRowProps {
    event: Event;
    href?: string;
    /** Right-hand slot: a status chip or a price. */
    aside?: React.ReactNode;
    footer?: React.ReactNode;
}

const categoryLabel = (value: string) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** One event as a row: tinted date, title, where and when, how full it is. The same on every list. */
export default function EventRow({ event, href, aside, footer }: EventRowProps) {
    const tone = toneFor(event.category);
    return (
        <Row href={href} leading={<DateBlock date={event.eventDate} tone={tone} />}>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-dark-300">
                        <span aria-hidden="true" className={`size-1.5 rounded-full ${toneDot[tone]}`} />{categoryLabel(event.category)}
                    </p>
                    <h3 className="display-sm mt-0.5 text-lg leading-snug text-dark-50 sm:text-xl">{event.title}</h3>
                </div>
                {aside && <div className="shrink-0">{aside}</div>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dark-300">
                <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{event.location}</span>
                <span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden="true" />{formatEventHours(event)}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <FillBar filled={event.hiredTalents.length} total={event.requiredCount} />
                {footer}
            </div>
        </Row>
    );
}
