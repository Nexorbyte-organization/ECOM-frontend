'use client';

import React, { useState } from 'react';
import { CheckCircle2, KeyRound, MapPin } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { checkIn } from '@/lib/api';
import { getCurrentLocation } from '@/lib/geolocation';
import { useLanguage } from '@/lib/i18n';
import { Event } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

// Shown around the event day; the backend enforces the exact check-in window.
export const isCheckInDay = (event: Event, now = Date.now()) => {
    const day = Date.parse(event.eventDate);
    return Number.isFinite(day) && now >= day - DAY_MS && now <= day + 2 * DAY_MS
        && event.status !== 'cancelled' && event.status !== 'completed' && !event.fundsReleasedAt;
};

// Backups for scanning the staff QR: type the 6-digit code under it (no camera needed), or
// "I'm here" near the staff or the venue. Both need the phone's location.
export default function UsherCheckInCard({ event }: { event: Event }) {
    const { language } = useLanguage();
    const ar = language !== 'en';
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState<'code' | 'location' | null>(null);
    const [error, setError] = useState('');
    const [done, setDone] = useState<string | null>(null);

    const submit = async (method: 'code' | 'location') => {
        setBusy(method);
        setError('');
        try {
            const location = await getCurrentLocation();
            const result = method === 'code'
                ? await checkIn({ method, eventId: event._id, code, location })
                : await checkIn({ method, eventId: event._id, location });
            setDone(result.attendance.status === 'late'
                ? (ar ? 'تم تسجيل حضورك (متأخر).' : 'You are checked in (late).')
                : (ar ? 'تم تسجيل حضورك.' : 'You are checked in.'));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not check you in.');
        } finally {
            setBusy(null);
        }
    };

    if (done) {
        return (
            <Card className="flex items-center gap-2 border-success-500/30 text-sm font-semibold text-success-500">
                <CheckCircle2 size={18} /> {done}
            </Card>
        );
    }

    return (
        <Card className="space-y-3 border-primary-500/25">
            <div>
                <h2 className="font-bold text-dark-50">{ar ? 'تسجيل الحضور' : 'Check in'}</h2>
                <p className="mt-1 text-xs text-dark-400">
                    {ar
                        ? 'امسح رمز QR على هاتف المشرف. إذا لم تعمل الكاميرا اكتب الكود المكتوب تحته، أو اضغط "أنا هنا" عند وصولك. يجب تفعيل الموقع.'
                        : 'Scan the QR on the supervisor’s phone. If your camera does not work, type the code under it, or tap “I’m here” when you arrive. Location must be on.'}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <input
                    inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456"
                    aria-label={ar ? 'كود الحضور' : 'Check-in code'}
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-32 rounded-lg border border-dark-600 bg-dark-900 px-3 py-2 font-mono text-lg tracking-widest text-dark-50"
                />
                <Button size="sm" icon={<KeyRound size={14} />} disabled={code.length !== 6 || Boolean(busy)} isLoading={busy === 'code'} onClick={() => submit('code')}>
                    {ar ? 'تأكيد الكود' : 'Check in with code'}
                </Button>
                <Button size="sm" variant="secondary" icon={<MapPin size={14} />} disabled={Boolean(busy)} isLoading={busy === 'location'} onClick={() => submit('location')}>
                    {ar ? 'أنا هنا' : 'I’m here'}
                </Button>
            </div>
            {error && <p role="alert" className="text-sm text-danger-400">{error}</p>}
            <p className="text-xs text-dark-500">
                {ar ? 'إذا كان هاتفك لا يعمل، اطلب من المشرف تسجيل حضورك.' : 'If your phone cannot do either, ask the supervisor to check you in.'}
            </p>
        </Card>
    );
}
