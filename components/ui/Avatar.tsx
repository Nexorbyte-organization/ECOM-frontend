import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
    src?: string;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
};

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);

    if (src && src !== failedSrc) {
        return (
            <img
                src={src}
                alt={name}
                onError={() => setFailedSrc(src)}
                className={cn(
                    'rounded-full object-cover ring-2 ring-white shadow-sm',
                    sizeStyles[size],
                    className
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-semibold',
                'bg-gradient-to-br from-primary-500 to-accent-500 text-white ring-2 ring-white shadow-sm',
                sizeStyles[size],
                className
            )}
            role="img"
            aria-label={name}
        >
            <UserRound className="w-1/2 h-1/2" aria-hidden="true" />
        </div>
    );
}
