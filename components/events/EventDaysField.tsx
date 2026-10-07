'use client';

import React from 'react';
import { CalendarPlus, Clock, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { MAX_EVENT_DAYS, formatDayDate, getEventDays } from '@/lib/utils';
import { EventDay } from '@/types';

// The day after `date` (YYYY-MM-DD), used to suggest the next event day.
const nextDate = (date: string) => {
    if (!date) return '';
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString().slice(0, 10);
};

// Every day the event runs, each with its own hours. `fixedCount` keeps the number of days (dates
// and times can still change); `minCount` stops days from being removed below it.
export default function EventDaysField({ days, onChange, disabled = false, fixedCount = false, minCount = 1 }: {
    days: EventDay[];
    onChange: (days: EventDay[]) => void;
    disabled?: boolean;
    fixedCount?: boolean;
    minCount?: number;
}) {
    const update = (index: number, changes: Partial<EventDay>) =>
        onChange(days.map((day, current) => (current === index ? { ...day, ...changes } : day)));
    const addDay = () => {
        const last = days[days.length - 1];
        onChange([...days, { date: nextDate(last?.date || ''), startTime: last?.startTime || '', endTime: last?.endTime || '' }]);
    };
    const canRemove = !disabled && !fixedCount && days.length > Math.max(1, minCount);

    return (
        <div className="space-y-3">
            {days.map((day, index) => (
                <div key={index} className="rounded-xl border border-dark-700 bg-dark-900/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-dark-400">
                            {days.length > 1 ? `Day ${index + 1}` : 'Event day'}
                            {day.date && <span className="ms-2 font-normal normal-case tracking-normal text-dark-500">{formatDayDate(day.date)}</span>}
                        </p>
                        {canRemove && (
                            <Button type="button" size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => onChange(days.filter((_, current) => current !== index))}
                                aria-label={`Remove day ${index + 1}`}>
                                Remove
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input label="Date" type="date" value={day.date} onChange={(e) => update(index, { date: e.target.value })} disabled={disabled} required />
                        <Input label="Start time" type="time" value={day.startTime} onChange={(e) => update(index, { startTime: e.target.value })} disabled={disabled} required />
                        <Input label="End time" type="time" value={day.endTime} onChange={(e) => update(index, { endTime: e.target.value })} disabled={disabled} required />
                    </div>
                </div>
            ))}
            {!fixedCount && !disabled && days.length < MAX_EVENT_DAYS && (
                <Button type="button" size="sm" variant="secondary" icon={<CalendarPlus size={14} />} onClick={addDay}>
                    Add another day
                </Button>
            )}
            <p className="text-xs text-dark-500">
                Each day can have different hours. Ushers check in every day and are paid the daily pay for each day they check in.
            </p>
        </div>
    );
}

// Read-only list of an event's days and hours.
export function EventScheduleList({ event, className = '' }: { event: { days?: EventDay[]; eventDate?: string; startTime?: string; endTime?: string }; className?: string }) {
    const days = getEventDays(event);
    if (days.length <= 1) return null;
    return (
        <ul className={`space-y-1.5 ${className}`}>
            {days.map((day, index) => (
                <li key={day.date} className="flex items-center justify-between gap-3 rounded-lg border border-dark-700 bg-dark-900/20 px-3 py-2 text-sm">
                    <span className="text-dark-200"><span className="text-dark-400">Day {index + 1} · </span>{formatDayDate(day.date)}</span>
                    <span className="inline-flex items-center gap-1 text-dark-300"><Clock size={13} /> {day.startTime} – {day.endTime}</span>
                </li>
            ))}
        </ul>
    );
}
