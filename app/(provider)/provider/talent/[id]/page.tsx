'use client';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTalentProfile, getTalentEventHistory, getReviewsForTalent, isVerifiedTalent } from '@/lib/api';
import { TalentProfile, Event, Application, Attendance, Review } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { formatDate, formatEventDates } from '@/lib/utils';
import { ArrowLeft, MapPin, Star, Briefcase, CalendarDays, Clock, Phone, MessageCircle } from 'lucide-react';

type HistoryItem = {
    event: Event;
    application: Application;
    attendance: Attendance | null;
    review: Review | null;
};

export default function TalentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<TalentProfile | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [talentReviews, setTalentReviews] = useState<(Review & { event: Event })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        const id = params.id as string;
        if (!id) return;

        Promise.all([
            getTalentProfile(id),
            getTalentEventHistory(id),
            getReviewsForTalent(id),
        ]).then(([p, h, r]) => {
            setProfile(p);
            setHistory(h);
            setTalentReviews(r);
            if (p) setVerified(isVerifiedTalent(p));
        }).catch((err) => setError(err instanceof Error ? err.message : 'Could not load talent profile.'))
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) {
        return <ContentSkeleton variant="profile" />;
    }

    if (!profile) {
        return (
            <div className="text-center py-16">
                <p className="text-dark-400">{error || 'Talent profile not found'}</p>
                <button onClick={() => router.back()} className="text-primary-500 hover:underline text-sm mt-2 cursor-pointer">Go back</button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors cursor-pointer">
                <ArrowLeft size={16} /> Back
            </button>

            {/* Profile Header */}
            <Card>
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <Avatar src={profile.photo} name={profile.fullName} size="xl" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h1 className="display text-3xl sm:text-4xl">{profile.fullName}</h1>
                            {verified && <Badge variant="success">✅ Verified</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-dark-400 mb-3 flex-wrap">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {profile.city}</span>
                            <span className="flex items-center gap-1"><Briefcase size={14} /> {profile.experienceYears}y experience</span>
                            <span className="flex items-center gap-1">{profile.education}</span>
                            {profile.phoneNumber && (
                                <span className="flex items-center gap-1">
                                    <Phone size={14} className="text-dark-500" />
                                    <a href={`tel:${profile.phoneNumber}`} className="hover:text-primary-500 transition-colors font-medium">{profile.phoneNumber}</a>
                                </span>
                            )}
                            {profile.whatsappNumber && (
                                <span className="flex items-center gap-1">
                                    <MessageCircle size={14} className="text-success-500" />
                                    <a href={`https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-success-600 text-success-500 font-semibold transition-colors">
                                        WhatsApp
                                    </a>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant="warning">{profile.ratingAverage} ★ Rating</Badge>
                            <Badge variant="primary">{profile.reliabilityScore}% Reliable</Badge>
                            <Badge variant="info">{profile.completedEventsCount} events completed</Badge>
                            {profile.lateExcuseCount >= 5 && (
                                <Badge variant="danger">⚠️ {profile.lateExcuseCount} Late Excuses</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Skills & Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 mb-3">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.languages.map((lang) => (
                            <Badge key={lang} variant="default">{lang}</Badge>
                        ))}
                    </div>
                </Card>
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 mb-3">Event Categories</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.categories.map((cat) => (
                            <Badge key={cat} variant="primary">{cat}</Badge>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Portfolio */}
            {profile.portfolioImages.length > 0 && (
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 mb-3">Portfolio</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {profile.portfolioImages.map((img, i) => (
                            <div key={i} className="rounded-xl overflow-hidden aspect-video">
                                <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Payment Methods */}
            <Card>
                <h3 className="text-sm font-semibold text-dark-300 mb-4">Payment Accounts</h3>
                {!profile.paymentMethods || profile.paymentMethods.length === 0 ? (
                    <p className="text-sm text-dark-500 italic">No payment accounts provided by this talent.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profile.paymentMethods.map((m) => (
                            <div key={m._id} className={`p-3 rounded-xl border flex items-center justify-between ${m.isDefault ? 'bg-primary-500/5 border-primary-500/25' : 'bg-dark-900/10 border-dark-800'}`}>
                                <div className="min-w-0">
                                    <p className="text-xs text-dark-400 font-semibold ">{m.provider}</p>
                                    {m.numberOrDetail && <p className="text-sm font-bold text-dark-100 truncate mt-0.5">{m.numberOrDetail}</p>}
                                </div>
                                {m.isDefault && (
                                    <Badge variant="success">Default</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Event History */}
            <Card>
                <h3 className="text-sm font-semibold text-dark-300 mb-4">
                    Event History ({history.length})
                </h3>
                {history.length === 0 ? (
                    <p className="text-sm text-dark-500 text-center py-6">No event history yet</p>
                ) : (
                    <div className="space-y-3">
                        {history.map((item) => (
                            <div key={item.application._id} className="flex items-start gap-4 p-4 rounded-xl border border-dark-700 hover:border-dark-600 transition-colors">
                                <div className="p-2 rounded-lg bg-primary-50 text-primary-500 mt-0.5">
                                    <CalendarDays size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-dark-100 truncate">{item.event.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-dark-400 mt-1">
                                        <span className="flex items-center gap-1"><Clock size={10} /> {formatEventDates(item.event)}</span>
                                        <span className="flex items-center gap-1"><MapPin size={10} /> {item.event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        {item.attendance ? (
                                            item.attendance.status === 'present' ? (
                                                <Badge variant="success">✓ Attended</Badge>
                                            ) : (
                                                <Badge variant="danger">✕ No Show</Badge>
                                            )
                                        ) : (
                                            <Badge variant="default">Hired</Badge>
                                        )}
                                        {item.review && (
                                            <Badge variant="warning">{item.review.rating} ★</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Reviews */}
            {talentReviews.length > 0 && (
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 mb-4">
                        Reviews ({talentReviews.length})
                    </h3>
                    <div className="space-y-3">
                        {talentReviews.map((rev) => (
                            <div key={rev._id} className="p-4 rounded-xl border border-dark-700">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-dark-100">{rev.event.title}</p>
                                    <div className="flex items-center gap-1 text-warning-500">
                                        {Array.from({ length: rev.rating }).map((_, i) => (
                                            <Star key={i} size={12} fill="currentColor" />
                                        ))}
                                    </div>
                                </div>
                                {rev.comment && <p className="text-sm text-dark-400">{rev.comment}</p>}
                                <p className="text-xs text-dark-500 mt-2">{formatDate(rev.createdAt)}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
