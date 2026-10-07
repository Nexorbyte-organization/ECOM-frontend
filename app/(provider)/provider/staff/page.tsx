'use client';

import { toast } from '@/lib/toast';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
    getStaffMembers, inviteStaffMember, removeStaffMember,
    providerBlockStaff, providerUnblockStaff, providerUpdateStaff,
    getProviderProfileByUserId, getProviderEvents, assignSupervisorToEvent,
} from '@/lib/api';
import { User, UserRole, Event } from '@/types';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { Users, UserPlus, Trash2, ShieldAlert, Shield, Mail, Ban, CheckCircle, Edit2, CalendarCheck, LoaderCircle } from 'lucide-react';
import Link from 'next/link';

export default function StaffManagementPage() {
    const { user, isOrganizer } = useAuth();
    const [staff, setStaff] = useState<Omit<User, 'password'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('member123');
    const [role, setRole] = useState<UserRole>(UserRole.PROVIDER_MEMBER);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState('');
    const [editFullName, setEditFullName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRole, setEditRole] = useState<UserRole>(UserRole.PROVIDER_MEMBER);
    const [editSubmitting, setEditSubmitting] = useState(false);

    const [eventsModalOpen, setEventsModalOpen] = useState(false);
    const [assigningSupervisor, setAssigningSupervisor] = useState<Omit<User, 'password'> | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [staffBusy, setStaffBusy] = useState<string | null>(null);
    const [assignmentBusy, setAssignmentBusy] = useState<string | null>(null);
    const [eventsLoading, setEventsLoading] = useState(false);

    const handleBlock = async (memberId: string) => {
        if (staffBusy) return;
        setStaffBusy(memberId);
        setError('');
        setSuccess('');
        try {
            await providerBlockStaff(memberId);
            setSuccess('Staff member blocked successfully.');
            fetchStaff();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to block staff member.');
        } finally { setStaffBusy(null); }
    };

    const handleUnblock = async (memberId: string) => {
        if (staffBusy) return;
        setStaffBusy(memberId);
        setError('');
        setSuccess('');
        try {
            await providerUnblockStaff(memberId);
            setSuccess('Staff member unblocked successfully.');
            fetchStaff();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to unblock staff member.');
        } finally { setStaffBusy(null); }
    };

    const handleEditOpen = (member: Omit<User, 'password'>) => {
        setError('');
        setSuccess('');
        setEditingStaffId(member._id);
        setEditFullName(member.fullName || member.email.split('@')[0]);
        setEditEmail(member.email);
        setEditPassword('');
        setEditRole(member.role as UserRole);
        setEditOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setEditSubmitting(true);
        try {
            await providerUpdateStaff(editingStaffId, {
                fullName: editFullName,
                email: editEmail,
                password: editPassword || undefined,
                role: editRole,
            });
            setSuccess('Staff member details updated successfully.');
            setEditOpen(false);
            fetchStaff();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update staff member.');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleOpenEventsModal = async (member: Omit<User, 'password'>) => {
        setError('');
        setSuccess('');
        setAssigningSupervisor(member);
        setEventsModalOpen(true);
        setEventsLoading(true);
        try {
            if (user) {
                const profile = await getProviderProfileByUserId(user._id);
                if (profile) {
                    const res = await getProviderEvents(profile._id, { limit: 100 });
                    setEvents(res.data);
                }
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load provider events');
        } finally {
            setEventsLoading(false);
        }
    };

    const handleToggleAssignment = async (eventId: string, currentSupervisorIds: string[]) => {
        if (!assigningSupervisor || assignmentBusy) return;
        setAssignmentBusy(eventId);
        const isAssigned = currentSupervisorIds.includes(assigningSupervisor._id);
        try {
            await assignSupervisorToEvent(eventId, assigningSupervisor._id, !isAssigned);
            // Refresh events
            if (user) {
                const profile = await getProviderProfileByUserId(user._id);
                if (profile) {
                    const res = await getProviderEvents(profile._id, { limit: 100 });
                    setEvents(res.data);
                }
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update event supervisor assignment');
        } finally { setAssignmentBusy(null); }
    };

    const fetchStaff = async () => {
        try {
            const data = await getStaffMembers();
            setStaff(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load staff.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && isOrganizer) {
            fetchStaff();
        } else {
            setLoading(false);
        }
    }, [user, isOrganizer]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await inviteStaffMember(fullName, email, password, role);
            setSuccess(`Staff member (${email}) invited successfully! Password: ${password}`);
            setFullName('');
            setEmail('');
            setPassword('member123');
            setRole(UserRole.PROVIDER_MEMBER);
            setInviteOpen(false);
            fetchStaff();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to invite staff member');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (memberId: string, memberEmail: string) => {
        if (!confirm(`Are you sure you want to remove staff member ${memberEmail}? They will lose all access to the workspace.`)) {
            return;
        }

        if (staffBusy) return;
        setStaffBusy(memberId);
        try {
            await removeStaffMember(memberId);
            setSuccess(`Removed staff member (${memberEmail}) successfully.`);
            fetchStaff();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove staff member');
        } finally { setStaffBusy(null); }
    };

    if (loading) {
        return <ContentSkeleton variant="list" />;
    }

    if (!isOrganizer) {
        return (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <Card className="max-w-md text-center p-8 border border-dark-700 bg-dark-950">
                    <ShieldAlert className="mx-auto text-danger-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-dark-50 mb-2">Access Denied</h2>
                    <p className="text-dark-400 text-sm mb-6">
                        Only the main company organizer can access staff management and invite other members.
                    </p>
                    <Link href="/provider/dashboard">
                        <Button variant="primary">Go to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="display text-5xl sm:text-6xl">Staff Management</h1>
                    <p className="text-dark-400 mt-1">Invite and manage roles for your event operations staff</p>
                </div>
                <Button onClick={() => { setError(''); setSuccess(''); setInviteOpen(true); }} icon={<UserPlus size={16} />}>
                    Invite Member
                </Button>
            </div>

            {success && (
                <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/20 text-success-400 text-sm animate-fade-in mb-4">
                    {success}
                </div>
            )}

            <Card className="overflow-hidden">
                {staff.length === 0 ? (
                    <div className="text-center py-12">
                        <Users size={32} className="mx-auto text-dark-600 mb-3" />
                        <p className="text-dark-400 text-sm">No staff members found.</p>
                        <p className="text-xs text-dark-500 mt-1">Click &quot;Invite Member&quot; to add your first operations staff.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-dark-700 text-xs text-dark-400 ">
                                    <th className="py-4 px-6 font-medium">Name</th>
                                    <th className="py-4 px-6 font-medium">Email</th>
                                    <th className="py-4 px-6 font-medium">Role</th>
                                    <th className="py-4 px-6 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-800">
                                 {staff.map((member) => {
                                     const displayName = member.fullName || member.email.split('@')[0]
                                         .split('.')
                                         .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                                         .join(' ');
                                     return (
                                         <tr key={member._id} className={`text-sm text-dark-200 hover:bg-dark-900/10 transition-colors ${member.isBlocked ? 'opacity-60' : ''}`}>
                                             <td className="py-4 px-6">
                                                 <div className="flex items-center gap-3">
                                                     <Avatar name={member.email} size="sm" />
                                                     <div>
                                                         <p className="font-semibold text-dark-100">{displayName}</p>
                                                         <p className="text-xs text-dark-400">Joined {new Date(member.createdAt).toLocaleDateString()}</p>
                                                     </div>
                                                 </div>
                                             </td>
                                             <td className="py-4 px-6 text-dark-300">
                                                 <div className="flex items-center gap-1.5">
                                                     <Mail size={14} className="text-dark-500" />
                                                     {member.email}
                                                 </div>
                                             </td>
                                             <td className="py-4 px-6">
                                                 <div className="flex items-center gap-2">
                                                     <Badge variant={member.role === UserRole.PROVIDER_SUPERVISOR ? 'warning' : 'primary'} className="capitalize flex items-center gap-1 w-fit">
                                                         <Shield size={12} />
                                                         {member.role === UserRole.PROVIDER_SUPERVISOR ? 'Supervisor' : 'Staff Member'}
                                                     </Badge>
                                                     {member.isBlocked && (
                                                         <Badge variant="danger">Blocked</Badge>
                                                     )}
                                                 </div>
                                             </td>
                                             <td className="py-4 px-6 text-right">
                                                 <div className="flex justify-end gap-1.5">
                                                     {member.role === UserRole.PROVIDER_SUPERVISOR && (
                                                         <button
                                                             onClick={() => handleOpenEventsModal(member)}
                                                             className="p-2 text-dark-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                                                             title="Assign to events"
                                                         >
                                                             <CalendarCheck size={15} />
                                                         </button>
                                                     )}
                                                     <button
                                                         onClick={() => handleEditOpen(member)}
                                                         className="p-2 text-dark-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-xl transition-all cursor-pointer"
                                                         title="Edit staff member"
                                                     >
                                                         <Edit2 size={15} />
                                                     </button>
                                                     {member.isBlocked ? (
                                                         <button
                                                             disabled={Boolean(staffBusy)} aria-busy={staffBusy === member._id} onClick={() => handleUnblock(member._id)}
                                                             className="p-2 text-success-500 hover:bg-success-500/10 rounded-xl transition-all cursor-pointer"
                                                             title="Unblock staff member"
                                                         >
                                                             {staffBusy === member._id ? <LoaderCircle aria-hidden="true" size={16} className="motion-safe:animate-spin" /> : <CheckCircle size={15} />}
                                                         </button>
                                                     ) : (
                                                         <button
                                                             disabled={Boolean(staffBusy)} aria-busy={staffBusy === member._id} onClick={() => handleBlock(member._id)}
                                                             className="p-2 text-danger-500 hover:bg-danger-500/10 rounded-xl transition-all cursor-pointer"
                                                             title="Block staff member"
                                                         >
                                                             {staffBusy === member._id ? <LoaderCircle aria-hidden="true" size={16} className="motion-safe:animate-spin" /> : <Ban size={15} />}
                                                         </button>
                                                     )}
                                                     <button
                                                         disabled={Boolean(staffBusy)} aria-busy={staffBusy === member._id} onClick={() => handleRemove(member._id, member.email)}
                                                         className="p-2 text-dark-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-xl transition-all cursor-pointer"
                                                         title="Remove staff member"
                                                     >
                                                         {staffBusy === member._id ? <LoaderCircle aria-hidden="true" size={16} className="motion-safe:animate-spin" /> : <Trash2 size={15} />}
                                                     </button>
                                                 </div>
                                             </td>
                                         </tr>
                                     );
                                 })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Staff Member">
                <form onSubmit={handleInvite} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        required
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. john@pyramidevents.com"
                        required
                    />

                    <Input
                        label="Temporary Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="member123"
                        required
                    />

                    <Select
                        label="Role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        options={[
                            { value: UserRole.PROVIDER_MEMBER, label: 'Staff Member' },
                            { value: UserRole.PROVIDER_SUPERVISOR, label: 'Supervisor' },
                        ]}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                        <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={submitting}>
                            Send Invite
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Staff Member Modal */}
            <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Staff Member">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Full Name"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        required
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="e.g. john@pyramidevents.com"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Leave empty to keep current password"
                    />

                    <Select
                        label="Role"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        options={[
                            { value: UserRole.PROVIDER_MEMBER, label: 'Staff Member' },
                            { value: UserRole.PROVIDER_SUPERVISOR, label: 'Supervisor' },
                        ]}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                        <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={editSubmitting}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Assign Supervisor to Events Modal */}
            <Modal
                isOpen={eventsModalOpen}
                onClose={() => setEventsModalOpen(false)}
                title={`Assign Supervisor: ${assigningSupervisor?.fullName || assigningSupervisor?.email.split('@')[0]}`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-dark-400">
                        Toggle which events this supervisor is assigned to.
                    </p>

                    <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
                        {eventsLoading ? (
                            <ContentSkeleton variant="list" />
                        ) : events.length === 0 ? (
                            <p className="text-sm text-dark-500 text-center py-6">No events found. Please create an event first.</p>
                        ) : (
                            events.map((event) => {
                                const supervisorIds = event.supervisorIds ?? [];
                                const isAssigned = supervisorIds.includes(assigningSupervisor?._id ?? '');
                                const otherSupervisors = staff.filter(
                                    (s) => supervisorIds.includes(s._id) && s._id !== assigningSupervisor?._id
                                );

                                return (
                                    <div
                                        key={event._id}
                                        className="flex items-center justify-between gap-4 p-3 rounded-xl bg-dark-900/10 border border-dark-800 hover:border-dark-700 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-dark-100 truncate">{event.title}</p>
                                            <p className="text-xs text-dark-400 mt-0.5">
                                                {new Date(event.eventDate).toLocaleDateString()} · {event.category}
                                            </p>
                                            {otherSupervisors.length > 0 && (
                                                <p className="text-xs text-dark-500 mt-0.5">
                                                    Also: {otherSupervisors.map(s => s.fullName || s.email.split('@')[0]).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            {isAssigned ? (
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    disabled={Boolean(assignmentBusy)} isLoading={assignmentBusy === event._id} onClick={() => handleToggleAssignment(event._id, supervisorIds)}
                                                >
                                                    Assigned ✕
                                                </Button>
                                            ) : otherSupervisors.length > 0 ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="border-warning-500/30 text-warning-500 hover:bg-warning-500/10 text-xs"
                                                    disabled={Boolean(assignmentBusy)} isLoading={assignmentBusy === event._id} onClick={() => handleToggleAssignment(event._id, supervisorIds)}
                                                >
                                                    Also Assign
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    disabled={Boolean(assignmentBusy)} isLoading={assignmentBusy === event._id} onClick={() => handleToggleAssignment(event._id, supervisorIds)}
                                                >
                                                    Assign
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-dark-700">
                        <Button variant="secondary" onClick={() => setEventsModalOpen(false)}>
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
