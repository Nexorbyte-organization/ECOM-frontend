import { AttendanceStatus } from '@/types';

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
