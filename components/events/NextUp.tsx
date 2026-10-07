import React from 'react';
import { MapPin, Clock, Shirt } from 'lucide-react';
import Countdown from '@/components/ui/Countdown';
import { toneBg, toneFor, startsAt } from '@/lib/ticket';
import { Event } from '@/types';
import { cn, formatEventHours, formatEventDates } from '@/lib/utils';

/** The one thing to look at when you open the app: the next event, with a live countdown. */
export default function NextUp({ event, label, children, className }: { event: Event; label: string; children?: React.ReactNode; className?: string }) {
    const tone = toneFor(event.category);
    return (
        <section aria-label={label} className={cn('relative overflow-hidden rounded-2xl p-6 text-ticket-ink sm:p-9', toneBg[tone], className)}>
            {/* The logo's two punches, scaled up and cropped by the edge. */}
            <span aria-hidden="true" className="pointer-events-none absolute -end-10 -top-16 size-60 rounded-full border-[14px] border-ticket-ink/10 sm:size-80" />
            <span aria-hidden="true" className="pointer-events-none absolute -end-44 -top-16 size-60 rounded-full border-[14px] border-ticket-ink/10 sm:size-80" />
            <div className="relative">
                <p className="flex items-center gap-2 text-sm font-semibold">
                    <span aria-hidden="true" className="live-dot size-2.5 rounded-full bg-ticket-ink" />{label}
                </p>
                <p className="display mt-3 text-[clamp(3.25rem,13vw,6.5rem)]"><Countdown to={startsAt(event.eventDate, event.startTime)} /></p>
                <h2 className="display-sm mt-2 max-w-[22ch] text-3xl sm:text-4xl">{event.title}</h2>
                <ul className="mt-5 flex flex-col gap-2 text-sm font-medium sm:flex-row sm:flex-wrap sm:gap-x-6">
                    <li className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" />{event.location}</li>
                    <li className="flex items-center gap-2"><Clock size={16} aria-hidden="true" />{formatEventDates(event)}, {formatEventHours(event)}</li>
                    {event.dressCode && <li className="flex items-center gap-2"><Shirt size={16} aria-hidden="true" />{event.dressCode}</li>}
                </ul>
                {children && <div className="mt-7 flex flex-wrap items-center gap-3">{children}</div>}
            </div>
        </section>
    );
}
