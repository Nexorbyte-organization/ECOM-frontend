'use client';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden="true" className={cn('rounded-lg bg-dark-700/30 motion-safe:animate-pulse', className)} />;
}

export function SkeletonGroup({ children, className }: { children: React.ReactNode; className?: string }) {
    const { language } = useLanguage();
    return <div role="status" aria-busy="true" className={className}>
        <span className="sr-only">{language === 'en' ? 'Loading content' : language === 'ar-eg' ? 'بنحمّل المحتوى' : 'جارٍ تحميل المحتوى'}</span>
        {children}
    </div>;
}

export default function ContentSkeleton({ variant = 'list', count, className }: {
    variant?: 'list' | 'cards' | 'dashboard' | 'profile' | 'detail' | 'form' | 'status' | 'qr'; count?: number; className?: string;
}) {
    if (variant === 'qr' || variant === 'status') return <SkeletonGroup className={cn('space-y-5 py-8', className)}>
        <Skeleton className={variant === 'qr' ? 'mx-auto h-60 w-60 max-w-full rounded-2xl' : 'mx-auto h-14 w-14 rounded-full'} />
        <Skeleton className="mx-auto h-7 w-2/3" /><Skeleton className="mx-auto mt-3 h-4 w-5/6" />
        <Skeleton className="mx-auto mt-5 h-10 w-40" />
    </SkeletonGroup>;
    return <SkeletonGroup className={cn('space-y-6', className)}>
        <div className="space-y-3"><Skeleton className="h-8 w-48 max-w-full" /><Skeleton className="h-4 w-72 max-w-full" /></div>
        {(variant === 'profile' || variant === 'detail') && <div className="flex items-center gap-4 rounded-2xl border border-dark-700 p-6">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" /><div className="flex-1 space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4" /></div>
        </div>}
        <div className={variant === 'cards' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : variant === 'dashboard' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4' : 'space-y-4'}>
            {Array.from({ length: count ?? (variant === 'dashboard' ? 4 : 3) }, (_, index) => <div key={index} className="space-y-4 rounded-2xl border border-dark-700 bg-dark-900/20 p-5">
                {variant === 'cards' && <Skeleton className="h-28 w-full" />}
                <Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" />
                {(variant === 'form' || variant === 'profile') && <Skeleton className="h-11 w-full" />}
                {variant === 'cards' && <Skeleton className="h-10 w-full" />}
            </div>)}
        </div>
        {variant === 'dashboard' && <div className="space-y-4 rounded-2xl border border-dark-700 p-6"><Skeleton className="h-6 w-40" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>}
    </SkeletonGroup>;
}

export function PageSkeleton({ workspace = false, variant = 'dashboard' }: { workspace?: boolean; variant?: 'dashboard' | 'form' }) {
    return <div className="flex min-h-screen bg-dark-950">
        {workspace && <aside aria-hidden="true" className="hidden w-64 shrink-0 space-y-6 border-e border-dark-700 p-6 lg:block">
            <Skeleton className="h-10 w-32" />{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </aside>}
        <main className="min-w-0 flex-1 p-5 sm:p-8"><ContentSkeleton variant={variant} className={variant === 'form' ? 'mx-auto max-w-md py-16' : 'mx-auto max-w-6xl py-6'} /></main>
    </div>;
}
