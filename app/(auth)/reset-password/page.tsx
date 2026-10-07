'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BrandLogo from '@/components/shared/BrandLogo';
import { resetPassword } from '@/lib/api';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const submit = async (event: FormEvent) => {
        event.preventDefault(); setError('');
        if (password.length < 8) return setError('Use at least 8 characters.');
        if (password !== confirmation) return setError('Passwords do not match.');
        const token = sessionStorage.getItem('usher_reset_token');
        if (!token) return setError('Your reset session is missing. Start the recovery flow again.');
        setLoading(true);
        try {
            await resetPassword(token, password);
            sessionStorage.removeItem('usher_reset_token'); sessionStorage.removeItem('usher_reset_email');
            sessionStorage.setItem('usher_registration_pending', 'Password updated. You can now sign in.');
            router.push('/login');
        } catch (err) { setError(err instanceof Error ? err.message : 'Could not reset password'); }
        finally { setLoading(false); }
    };
    return <main className="min-h-screen flex items-center justify-center px-5 py-16"><div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><BrandLogo /></div><div className="glass rounded-xl p-6 sm:p-8">
            <h1 className="display text-4xl text-dark-50">Choose a new password</h1>
            <p className="mt-2 mb-6 text-dark-400">Your reset token is short-lived and can only be used for this password change.</p>
            {error && <p className="mb-4 rounded-xl bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <form onSubmit={submit} className="space-y-5"><Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={16} />} required />
                <Input label="Confirm password" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} icon={<Lock size={16} />} required />
                <Button type="submit" isLoading={loading} className="w-full">Update password</Button></form>
        </div></div></main>;
}
