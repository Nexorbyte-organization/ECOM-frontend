'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { checkInWithAttendanceQr } from '@/lib/api';
import { AttendanceCheckInResult } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AttendanceCheckInPage() {
    const params = useParams<{ token: string }>();
    const submitted = useRef(false);
    const [result, setResult] = useState<AttendanceCheckInResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!params.token || submitted.current) return;
        submitted.current = true;
        checkInWithAttendanceQr(params.token)
            .then(setResult)
            .catch((err) => setError(err instanceof Error ? err.message : 'Could not confirm your attendance.'));
    }, [params.token]);

    const loading = !result && !error;

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
            <Card className="w-full text-center">
                {loading && (
                    <div className="space-y-4 py-8" role="status">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-dark-700 border-t-primary-500" />
                        <div>
                            <h1 className="text-xl font-bold text-dark-50">Confirming attendance</h1>
                            <p className="mt-1 text-sm text-dark-400">Please keep this page open.</p>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="space-y-5 py-5">
                        <CheckCircle2 size={56} className="mx-auto text-success-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-dark-50">
                                {result.alreadyCheckedIn ? 'Already checked in' : 'Attendance confirmed'}
                            </h1>
                            <p className="mt-2 text-sm text-dark-300">
                                You are marked present for <strong className="text-dark-100">{result.event.title}</strong>.
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
                            <h1 className="text-2xl font-bold text-dark-50">Check-in failed</h1>
                            <p className="mt-2 text-sm text-dark-300">{error}</p>
                        </div>
                        <Link href="/talent/jobs">
                            <Button variant="secondary">Back to my jobs</Button>
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}
