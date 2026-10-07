'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarDays, XCircle } from 'lucide-react';
import PunchConfirm from '@/components/ui/PunchConfirm';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { checkIn } from '@/lib/api';
import { getCurrentLocation } from '@/lib/geolocation';
import { AttendanceCheckInResult } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AttendanceCheckInPage() {
    const params = useParams<{ token: string }>();
    const submitted = useRef(false);
    const [result, setResult] = useState<AttendanceCheckInResult | null>(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);

    // The QR only proves which staff phone was scanned; the usher's location must be near it.
    const confirm = useCallback(() => getCurrentLocation()
        .then((location) => checkIn({ method: 'qr', token: params.token, location }))
        .then(setResult)
        .catch((err) => setError(err instanceof Error ? err.message : 'Could not confirm your attendance.')), [params.token]);

    useEffect(() => {
        if (!params.token || submitted.current) return;
        submitted.current = true;
        void confirm();
    }, [params.token, confirm]);

    const retry = () => {
        setError('');
        setAttempt((value) => value + 1);
        void confirm();
    };

    const loading = !result && !error;

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
            <Card className="w-full text-center">
                {loading && (
                    <div>
                        <ContentSkeleton variant="status" />
                        <p className="pb-4 text-sm text-dark-400">Confirming your location… Allow location when your browser asks.</p>
                    </div>
                )}

                {result && (
                    <div className="space-y-5 py-5">
                        <PunchConfirm size={80} className="mx-auto text-success-500" />
                        <div>
                            <h1 className="display-sm text-2xl text-dark-50">
                                {result.alreadyCheckedIn ? 'Already checked in' : 'Attendance confirmed'}
                            </h1>
                            <p className="mt-2 text-sm text-dark-300">
                                You are marked {result.attendance.status === 'late' ? 'late' : 'present'}
                                {(result.event.dayCount ?? 1) > 1 && ` on day ${(result.attendance.dayIndex ?? 0) + 1} of ${result.event.dayCount}`} for <strong className="text-dark-100">{result.event.title}</strong>.
                                {(result.event.dayCount ?? 1) > 1 && ' Check in again on each event day.'}
                            </p>
                        </div>
                        <div className="mx-auto flex w-fit items-center gap-2 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-dark-300">
                            <CalendarDays size={16} className="text-primary-400" />
                            {formatDate(result.event.eventDate)}
                        </div>
                        <Link href="/talent/jobs">
                            <Button>Back to my jobs</Button>
                        </Link>
                    </div>
                )}

                {error && (
                    <div className="space-y-5 py-5" role="alert">
                        <XCircle size={56} className="mx-auto text-danger-500" />
                        <div>
                            <h1 className="display text-3xl sm:text-4xl">Check-in failed</h1>
                            <p className="mt-2 text-sm text-dark-300">{error}</p>
                            <p className="mt-2 text-xs text-dark-500">If the code expired, scan the live code again or type the 6-digit code from your job page.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button onClick={retry} key={attempt}>Try again</Button>
                            <Link href="/talent/jobs">
                                <Button variant="secondary">Back to my jobs</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
