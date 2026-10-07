import { AttendanceStatus, EventDay } from '@/types';

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format a date to relative time (e.g., "2 days ago")
 */
export function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
}

/**
 * Calculate reliability score from attendance records
 */
export function calculateReliabilityScore(
    attendanceStatuses: AttendanceStatus[]
): number {
    if (attendanceStatuses.length === 0) return 0;
    const presentCount = attendanceStatuses.filter(
        (s) => s === AttendanceStatus.PRESENT
    ).length;
    return Math.round((presentCount / attendanceStatuses.length) * 100);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '…';
}

/**
 * Format currency in EGP
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Get initials from a full name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Classname helper (simple cn utility)
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

// ─── Constants ─────────────────────────────────────────

export const EVENT_CATEGORIES = [
    'Wedding',
    'Corporate',
    'Club',
    'Festival',
    'Private Party',
    'Conference',
    'Exhibition',
    'Sports Event',
];

export const CITIES = [
    'Cairo',
    'Giza',
    'New Cairo',
    'Alexandria',
    'El Alamein',
    'Sharm El Sheikh',
    'Hurghada',
    'Luxor',
];

export const LANGUAGES = [
    'Arabic',
    'English',
    'French',
    'German',
    'Italian',
    'Spanish',
    'Russian',
    'Turkish',
    'Chinese (Mandarin)',
];

// Mirrors the backend limit: standby can be at most half the staff count, rounded up.
export function maxStandbyCount(requiredCount: number): number {
    return Math.ceil(Math.max(Number(requiredCount) || 0, 0) / 2);
}

// ─── Event days ────────────────────────────────────────
// Mirrors the backend limits for multi-day events.
export const MAX_EVENT_DAYS = 14;
export const MAX_EVENT_SPAN_DAYS = 30;

type ScheduledEvent = { days?: EventDay[]; eventDate?: string; startTime?: string; endTime?: string };

/** The days an event runs, in date order. Events from before multi-day support run on eventDate only. */
export function getEventDays(event: ScheduledEvent | null | undefined): EventDay[] {
    if (event?.days?.length) return [...event.days].sort((a, b) => a.date.localeCompare(b.date));
    if (!event?.eventDate) return [];
    return [{ date: event.eventDate.slice(0, 10), startTime: event.startTime || '', endTime: event.endTime || '' }];
}

/** A YYYY-MM-DD calendar day as a short label, e.g. "Mon, Oct 5". */
export function formatDayDate(date: string): string {
    return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** "Oct 5, 2026" for one day, "Oct 5 – Oct 7, 2026 (3 days)" for several. */
export function formatEventDates(event: ScheduledEvent | null | undefined): string {
    const days = getEventDays(event);
    if (!days.length) return '';
    const label = (date: string, withYear: boolean) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC',
    });
    if (days.length === 1) return label(days[0].date, true);
    return `${label(days[0].date, false)} – ${label(days[days.length - 1].date, true)} (${days.length} days)`;
}

/** "18:00 – 23:00" for one day; "Hours vary by day" when the days differ. */
export function formatEventHours(event: ScheduledEvent | null | undefined): string {
    const days = getEventDays(event);
    if (!days.length) return '';
    const same = days.every((day) => day.startTime === days[0].startTime && day.endTime === days[0].endTime);
    return same ? `${days[0].startTime} – ${days[0].endTime}` : 'Hours vary by day';
}

/** Checks a schedule the way the backend does; returns an error message or null. */
export function validateEventDays(days: EventDay[]): string | null {
    if (!days.length) return 'Add at least one event day.';
    if (days.length > MAX_EVENT_DAYS) return `An event can run on at most ${MAX_EVENT_DAYS} days.`;
    for (const day of days) {
        if (!day.date) return 'Choose a date for every event day.';
        if (!day.startTime || !day.endTime) return `Enter start and end times for ${formatDayDate(day.date)}.`;
        if (day.startTime >= day.endTime) return `End time must be after start time on ${formatDayDate(day.date)}.`;
    }
    const dates = days.map((day) => day.date).sort();
    if (new Set(dates).size !== dates.length) return 'Each event day must be a different date.';
    const span = (Date.parse(`${dates[dates.length - 1]}T00:00:00Z`) - Date.parse(`${dates[0]}T00:00:00Z`)) / 86400000 + 1;
    if (span > MAX_EVENT_SPAN_DAYS) return `All event days must fall within ${MAX_EVENT_SPAN_DAYS} days.`;
    return null;
}
