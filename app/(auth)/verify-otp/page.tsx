'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BrandLogo from '@/components/shared/BrandLogo';
import { verifyResetOtp } from '@/lib/api';

export default function VerifyOtpPage() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    useEffect(() => { setEmail(sessionStorage.getItem('usher_reset_email') || ''); }, []);

    const submit = async (event: FormEvent) => {
        event.preventDefault(); setError('');
        if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code from your email.');
        setLoading(true);
        try {
            const token = await verifyResetOtp(email, otp);
            if (!token) throw new Error('The server did not return a reset token');
            sessionStorage.setItem('usher_reset_token', token);
            router.push('/reset-password');
        } catch (err) { setError(err instanceof Error ? err.message : 'Invalid code'); }
        finally { setLoading(false); }
    };

    return <main className="min-h-screen flex items-center justify-center px-5 py-16"><div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><BrandLogo /></div><div className="glass rounded-xl p-6 sm:p-8">
            <h1 className="display text-4xl text-dark-50">Check your email</h1>
            <p className="mt-2 mb-6 text-dark-400">Enter the one-time code sent to {email || 'your email'}.</p>
            {error && <p className="mb-4 rounded-xl bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <form onSubmit={submit} className="space-y-5"><Input label="Verification code" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} icon={<KeyRound size={16} />} required />
                <Button type="submit" isLoading={loading} className="w-full">Verify code</Button></form>
        </div></div></main>;
}
