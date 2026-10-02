'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
    getAllUsers, getAllTalentProfiles, getAllProviderProfiles,
    adminBlockUser, adminUnblockUser, adminResetLateExcuses,
    adminVerifyUser, adminUnverifyUser, adminInviteUser, adminDeleteUser,
} from '@/lib/api';
import { User, TalentProfile, ProviderProfile, UserRole } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { formatDate, CITIES } from '@/lib/utils';
import { Users, Search, MapPin, Star, Shield, AlertTriangle, Ban, CheckCircle, RotateCcw, ShieldCheck, ShieldOff, UserPlus, Trash2, LogIn, Wallet } from 'lucide-react';

export default function AdminUsersPage() {
    const { user: currentUser, switchToOrganization } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
    const [talents, setTalents] = useState<TalentProfile[]>([]);
    const [providers, setProviders] = useState<ProviderProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all' | 'talent' | 'provider' | 'admin' | 'blocked'>('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionError, setActionError] = useState('');
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        action: string;
        userId: string;
        userName: string;
    }>({ open: false, action: '', userId: '', userName: '' });

    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.TALENT);
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePassword, setInvitePassword] = useState('password123');
    const [inviteFullName, setInviteFullName] = useState('');
    const [inviteCity, setInviteCity] = useState('Cairo');
    const [inviteCompanyName, setInviteCompanyName] = useState('');
    const [inviteProviderProfileId, setInviteProviderProfileId] = useState('');
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSubmitting, setInviteSubmitting] = useState(false);

    const resetInviteForm = () => {
        setInviteRole(UserRole.TALENT);
        setInviteEmail('');
        setInvitePassword('password123');
        setInviteFullName('');
        setInviteCity('Cairo');
        setInviteCompanyName('');
        setInviteProviderProfileId('');
        setInviteError(null);
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError(null);
        if (!inviteEmail) {
            setInviteError('Email is required.');
            return;
        }

        setInviteSubmitting(true);
        try {
            await adminInviteUser({
                email: inviteEmail,
                password: invitePassword,
                role: inviteRole,
                fullName: inviteFullName,
                city: inviteCity,
                companyName: inviteCompanyName,
                providerProfileId: inviteProviderProfileId,
            });
            setInviteModalOpen(false);
            resetInviteForm();
            await fetchData();
        } catch (err: unknown) {
            setInviteError(err instanceof Error ? err.message : 'Failed to invite user.');
        } finally {
            setInviteSubmitting(false);
        }
    };

    const fetchData = async () => {
        const [u, t, p] = await Promise.all([
            getAllUsers(),
            getAllTalentProfiles(),
            getAllProviderProfiles(),
        ]);
        setUsers(u);
        setTalents(t);
        setProviders(p);
        setLoading(false);
    };

    useEffect(() => {
        void fetchData().catch((err) => {
            setActionError(err instanceof Error ? err.message : 'Could not load users.');
            setLoading(false);
        });
    }, []);

    const handleAction = async () => {
        const { action, userId } = confirmModal;
        setActionLoading(userId);
        setActionError('');
        setConfirmModal({ open: false, action: '', userId: '', userName: '' });
        try {
            if (action === 'block') await adminBlockUser(userId);
            else if (action === 'unblock') await adminUnblockUser(userId);
            else if (action === 'verify') await adminVerifyUser(userId);
            else if (action === 'unverify') await adminUnverifyUser(userId);
            else if (action === 'delete') await adminDeleteUser(userId);
            else if (action === 'resetExcuses') {
                const talent = talents.find(t => t.userId === userId);
                if (talent) await adminResetLateExcuses(talent._id);
            }
            await fetchData();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Could not update user.');
        } finally {
            setActionLoading(null);
        }
    };

    const openConfirm = (action: string, userId: string, userName: string) => {
        setConfirmModal({ open: true, action, userId, userName });
    };

    const handleSwitch = async (organizationId: string) => {
        setActionLoading(organizationId);
        setActionError('');
        try {
            await switchToOrganization(organizationId);
            router.push('/provider/dashboard');
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Could not switch to this organization.');
            setActionLoading(null);
        }
    };

    const getTalent = (userId: string) => talents.find(t => t.userId === userId);
    const getProvider = (u: Omit<User, 'password'>) => {
        if (u.providerProfileId) {
            return providers.find(p => p._id === u.providerProfileId);
        }
        return providers.find(p => p.userId === u._id);
    };

    const filtered = users.filter(u => {
        if (tab === 'blocked') return u.isBlocked;
        if (tab !== 'all') {
            if (tab === 'provider') {
                if (u.role !== 'provider' && u.role !== 'provider_member') return false;
            } else if (u.role !== tab) {
                return false;
            }
        }
        if (search) {
            const talent = getTalent(u._id);
            const provider = getProvider(u);
            const name = talent?.fullName || provider?.companyName || u.email;
            return name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        }
        return true;
    });

    const actionLabels: Record<string, { label: string; description: string }> = {
        block: { label: 'Block User', description: 'This user will be unable to log in until unblocked.' },
        unblock: { label: 'Unblock User', description: 'This user will be able to log in again.' },
        verify: { label: 'Verify User', description: 'This user will be marked as verified.' },
        unverify: { label: 'Remove Verification', description: 'This user will lose their verified status.' },
        resetExcuses: { label: 'Reset Late Excuses', description: 'This talent\'s late excuse counter will be reset to 0.' },
        delete: { label: 'Delete User', description: 'This user and their profile will be hidden and their data retained. Deleting an organization also hides its staff and events.' },
    };

    if (loading) {
        return <ContentSkeleton variant="list" />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {actionError && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{actionError}</p>}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-50">Users</h1>
                    <p className="text-dark-400 mt-1">Manage all platform users</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        resetInviteForm();
                        setInviteModalOpen(true);
                    }}
                    icon={<UserPlus size={16} />}
                >
                    Invite User
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border-2 border-dark-50 rounded-xl text-sm text-dark-100 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'talent', 'provider', 'admin', 'blocked'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer capitalize ${tab === t ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30' : 'text-dark-400 hover:text-dark-200 border border-dark-700 hover:border-dark-600'
                                }`}
                        >
                            {t}
                            {t === 'blocked' && ` (${users.filter(u => u.isBlocked).length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <Card className="text-center py-12">
                        <Users size={32} className="mx-auto text-dark-600 mb-3" />
                        <p className="text-dark-400">No users found</p>
                    </Card>
                ) : (
                    filtered.map((user) => {
                        const talent = getTalent(user._id);
                        const provider = getProvider(user);
                        const name = talent?.fullName || provider?.companyName || 'Admin';
                        const photo = talent?.photo || provider?.logo;
                        const location = talent?.city || provider?.location;
                        const isActioning = actionLoading === user._id;

                        return (
                            <Card key={user._id} className={`transition-opacity ${user.isBlocked ? 'opacity-60 border-danger-200' : ''}`}>
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* User Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <Avatar src={photo} name={name} size="lg" />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-dark-100">{name}</p>
                                                <Badge variant={user.role === 'admin' ? 'primary' : user.role === 'talent' ? 'success' : 'info'}>
                                                    {user.role}
                                                </Badge>
                                                {user.isBlocked && <Badge variant="danger">🚫 Blocked</Badge>}
                                                {user.isVerified && <Badge variant="success">✅ Verified</Badge>}
                                            </div>
                                            <p className="text-xs text-dark-400 mt-0.5 truncate">{user.email}</p>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                {location && (
                                                    <span className="text-xs text-dark-500 flex items-center gap-1">
                                                        <MapPin size={11} /> {location}
                                                    </span>
                                                )}
                                                <span className="text-xs text-dark-500">Joined {formatDate(user.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    {talent && (
                                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                                            <Badge variant="warning"><Star size={10} className="inline mr-1" />{talent.ratingAverage}</Badge>
                                            <Badge variant="primary"><Shield size={10} className="inline mr-1" />{talent.reliabilityScore}%</Badge>
                                            <Badge variant="default">{talent.completedEventsCount} events</Badge>
                                            {talent.lateExcuseCount >= 5 && (
                                                <Badge variant="danger"><AlertTriangle size={10} className="inline mr-1" />{talent.lateExcuseCount} Late</Badge>
                                            )}
                                        </div>
                                    )}
                                    {provider && provider.website && (
                                        <div className="shrink-0">
                                            <Badge variant="default">{provider.website.replace('https://', '')}</Badge>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {user._id !== currentUser?._id && (
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                            {user.role === UserRole.PROVIDER && !user.isBlocked && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={<LogIn size={14} />}
                                                    onClick={() => handleSwitch(user._id)}
                                                    isLoading={isActioning}
                                                >
                                                    Switch to {provider?.companyName || name}
                                                </Button>
                                            )}
                                            {user.role === UserRole.PROVIDER && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={<Wallet size={14} />}
                                                    onClick={() => router.push(`/admin/payments?org=${user._id}`)}
                                                >
                                                    Payments
                                                </Button>
                                            )}
                                            {/* Block / Unblock */}
                                            {user.isBlocked ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={<CheckCircle size={14} />}
                                                    onClick={() => openConfirm('unblock', user._id, name)}
                                                    isLoading={isActioning}
                                                >
                                                    Unblock
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={<Ban size={14} />}
                                                    onClick={() => openConfirm('block', user._id, name)}
                                                    isLoading={isActioning}
                                                    className="text-danger-500 hover:bg-danger-50"
                                                >
                                                    Block
                                                </Button>
                                            )}

                                            {/* Verify / Unverify (non-admins only) */}
                                            {user.role !== 'admin' && (
                                                user.isVerified ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={<ShieldOff size={14} />}
                                                        onClick={() => openConfirm('unverify', user._id, name)}
                                                        isLoading={isActioning}
                                                        className="text-dark-400"
                                                    >
                                                        Unverify
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        icon={<ShieldCheck size={14} />}
                                                        onClick={() => openConfirm('verify', user._id, name)}
                                                        isLoading={isActioning}
                                                    >
                                                        Verify
                                                    </Button>
                                                )
                                            )}

                                            {/* Reset Late Excuses (talent only with excuses) */}
                                            {talent && talent.lateExcuseCount > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={<RotateCcw size={14} />}
                                                    onClick={() => openConfirm('resetExcuses', user._id, name)}
                                                    isLoading={isActioning}
                                                    className="text-warning-500"
                                                >
                                                    Reset Excuses
                                                </Button>
                                            )}

                                            {/* Delete User */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<Trash2 size={14} />}
                                                onClick={() => openConfirm('delete', user._id, name)}
                                                isLoading={isActioning}
                                                className="text-danger-500 hover:bg-danger-50"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <p className="text-xs text-dark-500 text-center">Showing {filtered.length} of {users.length} users</p>

            {/* Confirmation Modal */}
            <Modal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, action: '', userId: '', userName: '' })} title="Confirm Action">
                <div className="space-y-4">
                    <p className="text-sm text-dark-300">
                        Are you sure you want to <strong className="text-dark-100">{actionLabels[confirmModal.action]?.label?.toLowerCase()}</strong> for{' '}
                        <strong className="text-dark-100">{confirmModal.userName}</strong>?
                    </p>
                    <p className="text-xs text-dark-500">{actionLabels[confirmModal.action]?.description}</p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmModal({ open: false, action: '', userId: '', userName: '' })}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={confirmModal.action === 'block' || confirmModal.action === 'unverify' ? 'danger' : 'primary'}
                            onClick={handleAction}
                            className="flex-1"
                        >
                            {actionLabels[confirmModal.action]?.label || 'Confirm'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Invite User Modal */}
            <Modal
                isOpen={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                title="Invite User"
            >
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                    {inviteError && (
                        <div className="p-3 bg-danger-50 text-danger-600 rounded-xl text-xs font-medium border border-danger-100">
                            {inviteError}
                        </div>
                    )}

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="e.g. user@domain.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Default is 'password123'"
                        value={invitePassword}
                        onChange={(e) => setInvitePassword(e.target.value)}
                    />

                    <Select
                        label="Role"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                        options={[
                            { value: UserRole.TALENT, label: 'Talent' },
                            { value: UserRole.PROVIDER, label: 'Provider (Organizer)' },
                            { value: UserRole.PROVIDER_MEMBER, label: 'Provider Staff' },
                            { value: UserRole.ADMIN, label: 'Admin' },
                        ]}
                    />

                    {inviteRole === UserRole.TALENT && (
                        <>
                            <Input
                                label="Full Name"
                                placeholder="e.g. Aly Maher"
                                value={inviteFullName}
                                onChange={(e) => setInviteFullName(e.target.value)}
                                required
                            />
                            <Select
                                label="City"
                                value={inviteCity}
                                onChange={(e) => setInviteCity(e.target.value)}
                                options={CITIES.map((c) => ({ value: c, label: c }))}
                            />
                        </>
                    )}

                    {inviteRole === UserRole.PROVIDER && (
                        <>
                            <Input
                                label="Company Name"
                                placeholder="e.g. Nile Cruise Events"
                                value={inviteCompanyName}
                                onChange={(e) => setInviteCompanyName(e.target.value)}
                                required
                            />
                            <Select
                                label="Location"
                                value={inviteCity}
                                onChange={(e) => setInviteCity(e.target.value)}
                                options={CITIES.map((c) => ({ value: c, label: c }))}
                            />
                        </>
                    )}

                    {inviteRole === UserRole.PROVIDER_MEMBER && (
                        <>
                            <Input
                                label="Staff Member Name"
                                placeholder="e.g. Ahmed Aly"
                                value={inviteFullName}
                                onChange={(e) => setInviteFullName(e.target.value)}
                                required
                            />
                            <Select
                                label="Select Company"
                                value={inviteProviderProfileId}
                                onChange={(e) => setInviteProviderProfileId(e.target.value)}
                                placeholder="Select a provider company..."
                                options={providers.map((p) => ({
                                    value: p._id,
                                    label: p.companyName || 'Unnamed Company',
                                }))}
                                required
                            />
                        </>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => setInviteModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            isLoading={inviteSubmitting}
                            className="flex-1"
                        >
                            Send Invitation
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
