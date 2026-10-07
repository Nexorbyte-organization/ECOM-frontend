export type TicketTone = 'coral' | 'lime' | 'sky' | 'pink' | 'amber' | 'mint';

const categoryTone: Record<string, TicketTone> = {
    wedding: 'coral', corporate: 'sky', club: 'pink', festival: 'lime',
    private_party: 'pink', 'private party': 'pink', conference: 'mint', exhibition: 'amber', sport_event: 'lime', 'sport event': 'lime',
};

export function toneFor(category?: string): TicketTone {
    return categoryTone[(category || '').toLowerCase()] || 'amber';
}

export const toneBg: Record<TicketTone, string> = {
    coral: 'bg-ticket-coral', lime: 'bg-ticket-lime', sky: 'bg-ticket-sky', pink: 'bg-ticket-pink', amber: 'bg-ticket-amber', mint: 'bg-ticket-mint',
};
export const toneDot: Record<TicketTone, string> = toneBg;

/** Whole days from today (local) to a YYYY-MM-DD date; negative when past. */
export function daysUntil(date: string): number {
    const target = new Date(`${date.slice(0, 10)}T00:00:00`);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export function startsAt(date: string, startTime?: string): Date {
    return new Date(`${date.slice(0, 10)}T${startTime || '00:00'}:00`);
}
