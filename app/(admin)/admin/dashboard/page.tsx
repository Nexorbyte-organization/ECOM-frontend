'use client';

import React, { useEffect, useState } from 'react';
import { getAllUsers, getAllEvents, getAllTalentProfiles } from '@/lib/api';
import { User, Event, TalentProfile } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Users, Calendar, Briefcase, Building2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [talents, setTalents] = useState<TalentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            getAllUsers(),
            getAllEvents(),
            getAllTalentProfiles(),
        ]).then(([u, e, t]) => {
            setUsers(u);
            setEvents(e);
            setTalents(t);
        }).catch((err) => setError(err instanceof Error ? err.message : 'Could not load dashboard.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 glass rounded-2xl animate-pulse" />)}</div>;
    }

    const totalUsers = users.length;
    const totalTalents = users.filter(u => u.role === 'talent').length;
    const totalProviders = users.filter(u => u.role === 'provider').length;
    const totalEvents = events.length;
    const openEvents = events.filter(e => e.status === 'open').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    const flaggedTalents = talents.filter(t => t.lateExcuseCount >= 5);
    const topTalents = [...talents].sort((a, b) => b.ratingAverage - a.ratingAverage).slice(0, 5);
    const recentEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <div className="space-y-6 animate-fade-in">
            {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
            <div>
                <h1 className="text-2xl font-bold text-dark-50">Admin Dashboard</h1>
                <p className="text-dark-400 mt-1">Platform overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary-50 text-primary-500">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-50">{totalUsers}</p>
                            <p className="text-xs text-dark-400">Total Users</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-50">{totalTalents}</p>
                            <p className="text-xs text-dark-400">Talents</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-success-50 text-success-500">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-50">{totalProviders}</p>
                            <p className="text-xs text-dark-400">Providers</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-warning-50 text-warning-500">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-50">{totalEvents}</p>
                            <p className="text-xs text-dark-400">Total Events</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Event Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success-50 text-success-500">
                            <CheckCircle size={18} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-dark-50">{openEvents}</p>
                            <p className="text-xs text-dark-400">Open Events</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-50 text-primary-500">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-dark-50">{completedEvents}</p>
                            <p className="text-xs text-dark-400">Completed Events</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-danger-50 text-danger-500">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-dark-50">{flaggedTalents.length}</p>
                            <p className="text-xs text-dark-400">Flagged Talents</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Events */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">Recent Events</h3>
                        <Link href="/admin/events" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
                    </div>
                    <div className="space-y-3">
                        {recentEvents.map((event) => (
                            <div key={event._id} className="flex items-center justify-between p-3 rounded-xl border border-dark-700 hover:border-dark-600 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-dark-100 truncate">{event.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-dark-400">{formatDate(event.eventDate)}</span>
                                        <span className="text-xs text-dark-500">·</span>
                                        <span className="text-xs text-dark-400">{event.location}</span>
                                    </div>
                                </div>
                                <Badge variant={event.status === 'open' ? 'success' : event.status === 'completed' ? 'default' : 'primary'}>
                                    {event.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Top Rated Talents */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">Top Rated Talents</h3>
                        <Link href="/admin/users" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
                    </div>
                    <div className="space-y-3">
                        {topTalents.map((talent, idx) => (
                            <div key={talent._id} className="flex items-center justify-between p-3 rounded-xl border border-dark-700 hover:border-dark-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center text-xs font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-dark-100">{talent.fullName}</p>
                                        <p className="text-xs text-dark-400">{talent.city} · {talent.completedEventsCount} events</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="warning">{talent.ratingAverage} ★</Badge>
                                    {talent.lateExcuseCount >= 5 && <Badge variant="danger">⚠️</Badge>}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Flagged Talents */}
            {flaggedTalents.length > 0 && (
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">
                        ⚠️ Flagged Talents ({flaggedTalents.length})
                    </h3>
                    <div className="space-y-3">
                        {flaggedTalents.map((talent) => (
                            <div key={talent._id} className="flex items-center justify-between p-3 rounded-xl border border-danger-200 bg-danger-50/50">
                                <div>
                                    <p className="text-sm font-medium text-dark-100">{talent.fullName}</p>
                                    <p className="text-xs text-dark-400">{talent.city} · {talent.completedEventsCount} events completed</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="danger">{talent.lateExcuseCount} Late Excuses</Badge>
                                    <Badge variant="default">{talent.consecutiveGoodEvents}/5 progress</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
