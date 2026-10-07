'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n';

const pad = (n: number) => String(n).padStart(2, '0');

/** Ticks every second inside the last day; otherwise "in N days". */
export default function Countdown({ to, className }: { to: Date; className?: string }) {
    const { language } = useLanguage();
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        const first = window.setTimeout(() => setNow(Date.now()), 0);
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => { window.clearTimeout(first); window.clearInterval(id); };
    }, []);
    if (now === null) return <span className={className}>&nbsp;</span>;
    const ms = to.getTime() - now;
    const ar = language !== 'en';
    if (ms <= 0) return <span className={className}>{language === 'ar-eg' ? 'شغّال دلوقتي' : ar ? 'جارية الآن' : 'Live now'}</span>;
    const days = Math.floor(ms / 86_400_000);
    if (days >= 1) return <span className={className}>{ar ? `بعد ${days} ${days === 1 ? 'يوم' : 'أيام'}` : `in ${days} ${days === 1 ? 'day' : 'days'}`}</span>;
    const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000), s = Math.floor((ms % 60_000) / 1000);
    return <span className={`${className ?? ''} tabular-nums`} dir="ltr">{pad(h)}:{pad(m)}:{pad(s)}</span>;
}
