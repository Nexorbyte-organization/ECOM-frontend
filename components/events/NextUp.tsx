import React from 'react';
import { MapPin, Clock, Shirt } from 'lucide-react';
import Countdown from '@/components/ui/Countdown';
import { startsAt } from '@/lib/ticket';
import { Event } from '@/types';
import { cn, formatEventHours, formatEventDates } from '@/lib/utils';

/** The one colour field on a home screen: the next event, with a live countdown. */
export default function NextUp({ event, label, children, className }: { event: Event; label: string; children?: React.ReactNode; className?: string }) {
    return (
        <section aria-label={label} className={cn('relative overflow-hidden rounded-2xl bg-bottle p-6 text-bottle-text sm:p-8', className)}>
            {/* The logo's two punches, scaled up and cropped by the edge. */}
            <span aria-hidden="true" className="pointer-events-none absolute -end-12 -top-20 size-64 rounded-full border-[18px] border-white/[0.05] sm:size-80" />
            <span aria-hidden="true" className="pointer-events-none absolute -end-48 -top-20 size-64 rounded-full border-[18px] border-white/[0.05] sm:size-80" />
            <div className="relative">
                <p className="flex items-center gap-2 text-sm font-medium text-bottle-muted">
                    <span aria-hidden="true" className="live-dot size-2 rounded-full bg-accent-400" />{label}
                </p>
                <p className="display mt-2 text-[clamp(2.75rem,9vw,4.5rem)] text-white"><Countdown to={startsAt(event.eventDate, event.startTime)} /></p>
                <h2 className="display-sm mt-1 max-w-[26ch] text-2xl text-white sm:text-3xl">{event.title}</h2>
                <ul className="mt-4 flex flex-col gap-1.5 text-sm text-bottle-text sm:flex-row sm:flex-wrap sm:gap-x-6">
                    <li className="flex items-center gap-2"><MapPin size={15} aria-hidden="true" />{event.location}</li>
                    <li className="flex items-center gap-2"><Clock size={15} aria-hidden="true" />{formatEventDates(event)}, {formatEventHours(event)}</li>
                    {event.dressCode && <li className="flex items-center gap-2"><Shirt size={15} aria-hidden="true" />{event.dressCode}</li>}
                </ul>
                {children && <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}
            </div>
        </section>
    );
}
