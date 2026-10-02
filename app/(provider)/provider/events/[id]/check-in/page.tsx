'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, LocateFixed, MapPinOff, Power, ShieldCheck } from 'lucide-react';
import { closeCheckInPoint, getEvent, refreshCheckInPoint } from '@/lib/api';
import { LocationError, watchLocation } from '@/lib/geolocation';
import { CheckInPointView, Event, GeoLocation } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ContentSkeleton from '@/components/ui/Skeleton';

// The screen reports the phone's location and fetches the current code this often. Codes rotate
// every 30 seconds, so the screen always shows a live one.
const REFRESH_MS = 10000;

const formatTime = (value: string) => new Date(value).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });

export default function StaffCheckInPage() {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [view, setView] = useState<CheckInPointView | null>(null);
    const [location, setLocation] = useState<GeoLocation | null>(null);
    const [locationError, setLocationError] = useState<LocationError | null>(null);
    const [label, setLabel] = useState('');
    const [error, setError] = useState('');
    const [closed, setClosed] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const locationRef = useRef<GeoLocation | null>(null);
    const labelRef = useRef('');

    useEffect(() => {
        getEvent(id).then(setEvent).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load the event.'));
    }, [id]);

    useEffect(() => {
        if (closed) return undefined;
        return watchLocation((next) => {
            locationRef.current = next;
            setLocation(next);
            setLocationError(null);
        }, setLocationError);
    }, [closed]);

    const refresh = useCallback(async () => {
        const current = locationRef.current;
        if (!current) return;
        try {
            setView(await refreshCheckInPoint(id, current, labelRef.current.trim() || undefined));
            setError('');
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not refresh the check-in code.');
        }
    }, [id]);

    useEffect(() => {
        if (closed || !location) return undefined;
        void refresh();
        const timer = window.setInterval(() => void refresh(), REFRESH_MS);
        return () => window.clearInterval(timer);
        // The first location starts the loop; later locations are read from the ref.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [closed, Boolean(location), refresh]);

    useEffect(() => {
        if (!view?.expiresAt) return undefined;
        const tick = () => {
            const left = Math.max(0, Math.ceil((Date.parse(view.expiresAt!) - Date.now()) / 1000));
            setSecondsLeft(left);
            if (left === 0) void refresh();
        };
        tick();
        const timer = window.setInterval(tick, 1000);
        return () => window.clearInterval(timer);
    }, [view?.expiresAt, refresh]);

    const handleClose = async () => {
        setClosed(true);
        try { await closeCheckInPoint(id); } catch { /* The point stops counting once it stops reporting. */ }
    };

    if (!event && !error) return <ContentSkeleton variant="qr" />;

    return (
        <div className="mx-auto max-w-xl space-y-5 animate-fade-in">
            <Link href={`/provider/events/${id}`} className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200">
                <ArrowLeft size={16} /> Back to event
            </Link>
            <div>
                <h1 className="text-xl font-bold text-dark-50">Check-in screen</h1>
                {event && <p className="mt-1 text-sm text-dark-400">{event.title}</p>}
            </div>
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}

            {closed ? (
                <Card className="space-y-3 text-center">
                    <Power size={36} className="mx-auto text-dark-500" />
                    <p className="text-sm text-dark-300">This check-in point is closed. Ushers can still check in at other open points or with “I’m here”.</p>
                    <Button onClick={() => setClosed(false)}>Open it again</Button>
                </Card>
            ) : locationError ? (
                <Card className="space-y-3 text-center">
                    <div role="alert" className="space-y-3">
                        <MapPinOff size={36} className="mx-auto text-warning-400" />
                        <p className="font-semibold text-dark-100">Location is needed for check-in</p>
                        <p className="text-sm text-dark-400">{locationError.message} Ushers must be near this phone to check in, so it has to share where it is.</p>
                    </div>
                </Card>
            ) : !location ? (
                <Card className="space-y-3 text-center">
                    <LocateFixed size={36} className="mx-auto animate-pulse text-primary-400" />
                    <p className="text-sm text-dark-300">Finding this phone’s location… Allow location when the browser asks.</p>
                </Card>
            ) : !view ? (
                <ContentSkeleton variant="qr" />
            ) : !view.open ? (
                <Card className="space-y-2 text-center">
                    <p className="font-semibold text-dark-100">Check-in is not open now</p>
                    <p className="text-sm text-dark-400">
                        It opens {formatTime(view.opensAt)} and closes {formatTime(view.closesAt)}. Keep this screen open and the code appears automatically.
                    </p>
                </Card>
            ) : (
                <Card className="space-y-5 text-center">
                    <div className="mx-auto w-fit rounded-lg bg-white p-4">
                        <QRCodeSVG value={view.checkInUrl!} size={248} level="M" marginSize={1} title={`Check-in for ${event?.title || 'the event'}`} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-dark-500">Or type this code</p>
                        <p className="mt-1 font-mono text-4xl font-black tracking-[0.3em] text-dark-50" aria-live="polite">{view.code}</p>
                        <p className="mt-1 text-xs text-dark-500">Changes in {secondsLeft}s</p>
                    </div>
                    <div className="flex items-start justify-center gap-2 text-left text-sm text-dark-300">
                        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-success-500" />
                        <p className="max-w-sm">
                            Ushers must be within 200 m of this phone. The code changes every 30 seconds, so a photo of it does not work elsewhere.
                        </p>
                    </div>
                </Card>
            )}

            {!closed && (
                <Card className="space-y-3">
                    <Input
                        label="Name this check-in point (optional)"
                        placeholder="e.g. Bus 1, Main gate"
                        value={label}
                        maxLength={80}
                        onChange={(event) => { setLabel(event.target.value); labelRef.current = event.target.value; }}
                    />
                    <p className="text-xs text-dark-500">
                        Open this screen on each supervisor’s phone where ushers meet: the gathering point, the bus, or the venue.
                        {location?.accuracy ? ` Location accuracy: about ${location.accuracy} m.` : ''}
                    </p>
                    <Button variant="secondary" icon={<Power size={15} />} onClick={handleClose}>Close this check-in point</Button>
                </Card>
            )}
        </div>
    );
}
