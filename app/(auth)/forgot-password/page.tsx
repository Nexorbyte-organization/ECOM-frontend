'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BrandLogo from '@/components/shared/BrandLogo';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true); setError('');
        try {
            await forgotPassword(email);
            sessionStorage.setItem('usher_reset_email', email);
            router.push('/verify-otp');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start password recovery');
        } finally { setLoading(false); }
    };

    return <main className="min-h-screen flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md"><div className="flex justify-center mb-8"><BrandLogo /></div>
            <div className="glass rounded-2xl p-6 sm:p-8">
                <h1 className="text-3xl font-black text-dark-50">Reset your password</h1>
                <p className="mt-2 mb-6 text-dark-400">Enter your account email and we’ll send a one-time code.</p>
                {error && <p className="mb-4 rounded-xl bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
                <form onSubmit={submit} className="space-y-5">
                    <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} required />
                    <Button type="submit" isLoading={loading} className="w-full">Send code</Button>
                </form>
                <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-primary-500">Back to sign in</Link>
            </div>
        </div>
    </main>;
}
