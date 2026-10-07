export type TicketTone = 'coral' | 'sky' | 'sun' | 'teal' | 'rose' | 'lime';

const categoryTone: Record<string, TicketTone> = {
    wedding: 'coral', corporate: 'sky', club: 'rose', festival: 'lime',
    private_party: 'rose', 'private party': 'rose', conference: 'teal', exhibition: 'sun', sport_event: 'lime', 'sport event': 'lime',
};

export function toneFor(category?: string): TicketTone {
    return categoryTone[(category || '').toLowerCase()] || 'sun';
}

/** Solid dot, soft tint and readable text for each category hue. Written out in full so Tailwind sees every class. */
export const toneDot: Record<TicketTone, string> = {
    coral: 'bg-cat-coral', sky: 'bg-cat-sky', sun: 'bg-cat-sun', teal: 'bg-cat-teal', rose: 'bg-cat-rose', lime: 'bg-cat-lime',
};
export const toneTint: Record<TicketTone, string> = {
    coral: 'bg-cat-coral/12', sky: 'bg-cat-sky/12', sun: 'bg-cat-sun/15', teal: 'bg-cat-teal/12', rose: 'bg-cat-rose/12', lime: 'bg-cat-lime/15',
};
export const toneText: Record<TicketTone, string> = {
    coral: 'text-cat-coral-ink', sky: 'text-cat-sky-ink', sun: 'text-cat-sun-ink', teal: 'text-cat-teal-ink', rose: 'text-cat-rose-ink', lime: 'text-cat-lime-ink',
};
export const toneBg = toneDot;

/** Whole days from today (local) to a YYYY-MM-DD date; negative when past. */
export function daysUntil(date: string): number {
    const target = new Date(`${date.slice(0, 10)}T00:00:00`);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export function startsAt(date: string, startTime?: string): Date {
    return new Date(`${date.slice(0, 10)}T${startTime || '00:00'}:00`);
}
