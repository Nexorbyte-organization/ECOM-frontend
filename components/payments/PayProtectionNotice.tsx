'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { PaymentProtection } from '@/types';

const COPY: Record<PaymentProtection, { en: string; ar: string; tone: string; Icon: typeof ShieldCheck }> = {
    secured: {
        en: 'Your pay is secured. The organization funded it in advance and OO-Ushers releases it to you after the event.',
        ar: 'أجرك مضمون. قامت الجهة المنظمة بتمويله مقدمًا وسيتم تحويله لك بعد الفعالية.',
        tone: 'border-success-500/30 bg-success-500/10 text-success-500',
        Icon: ShieldCheck,
    },
    awaiting_funding: {
        en: 'The organization has not funded your pay yet. It is due 48 hours before the event starts.',
        ar: 'لم تقم الجهة المنظمة بتمويل أجرك بعد. يجب التمويل قبل بدء الفعالية بـ48 ساعة.',
        tone: 'border-warning-500/30 bg-warning-500/10 text-warning-500',
        Icon: AlertTriangle,
    },
    released: {
        en: 'Payments for this event were released. Check your notifications for your payout.',
        ar: 'تم صرف مستحقات هذه الفعالية. تابع الإشعارات لمعرفة حالة التحويل.',
        tone: 'border-success-500/30 bg-success-500/10 text-success-500',
        Icon: CheckCircle2,
    },
    pay_after: {
        en: 'This trusted organization pays ushers after the event.',
        ar: 'هذه جهة موثوقة تدفع للمنظمين بعد انتهاء الفعالية.',
        tone: 'border-dark-700 bg-dark-900/40 text-dark-300',
        Icon: Wallet,
    },
};

export default function PayProtectionNotice({ protection }: { protection?: PaymentProtection }) {
    const { language } = useLanguage();
    if (!protection) return null;
    const copy = COPY[protection];
    return (
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-medium ${copy.tone}`}>
            <copy.Icon size={16} className="mt-0.5 shrink-0" />
            <span>{language === 'en' ? copy.en : copy.ar}</span>
        </div>
    );
}
