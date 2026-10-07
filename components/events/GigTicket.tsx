import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import Ticket, { FillDots } from '@/components/ui/Ticket';
import { toneFor } from '@/lib/ticket';
import { Event } from '@/types';
import { formatEventHours } from '@/lib/utils';

interface GigTicketProps {
    event: Event;
    href?: string;
    /** Right-hand slot: a status marker, a price, or a button. */
    aside?: React.ReactNode;
    footer?: React.ReactNode;
    bg?: string;
}

const categoryLabel = (value: string) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** One event, drawn as a ticket. Used on every list so a gig looks the same everywhere. */
export default function GigTicket({ event, href, aside, footer, bg }: GigTicketProps) {
    return (
        <Ticket date={event.eventDate} tone={toneFor(event.category)} href={href} bg={bg}>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-dark-300">{categoryLabel(event.category)}</p>
                    <h3 className="display-sm mt-0.5 text-xl leading-tight text-dark-50 sm:text-2xl">{event.title}</h3>
                </div>
                {aside && <div className="shrink-0">{aside}</div>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-dark-300">
                <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{event.location}</span>
                <span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden="true" />{formatEventHours(event)}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <FillDots filled={event.hiredTalents.length} total={event.requiredCount} />
                {footer}
            </div>
        </Ticket>
    );
}
