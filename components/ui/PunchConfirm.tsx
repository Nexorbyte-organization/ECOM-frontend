import { cn } from '@/lib/utils';

// Check-in confirmed: the ring closes, then the hole fills with tungsten — the same punch as the
// logo. Plays once when it appears, in response to the person checking in.
export default function PunchConfirm({ size = 28, className }: { size?: number; className?: string }) {
    return (
        <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={cn('punch-confirm shrink-0', className)}>
            <circle className="punch-ring" cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform="rotate(-90 24 24)" />
            <circle className="punch-hole" cx="24" cy="24" r="11" fill="var(--color-accent-400)" />
        </svg>
    );
}
