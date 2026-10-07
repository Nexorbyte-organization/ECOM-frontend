'use client';

import { toast } from '@/lib/toast';

import ContentSkeleton from '@/components/ui/Skeleton';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
    getProviderProfileByUserId, updateProviderProfile, getOrganizerCards,
    startOrganizerCardEnrollment, getOrganizerCardEnrollment,
    setDefaultOrganizerCard, removeOrganizerCard,
} from '@/lib/api';
import { OrganizerCard, ProviderProfile } from '@/types';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { CITIES } from '@/lib/utils';
import { Save, Camera, ShieldAlert, Star, CreditCard, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { announceProfileUpdated } from '@/lib/profile-completion';
import { formatEgyptianMobile, isEgyptianMobile, internationalMobile } from '@/lib/phone';

export default function ProviderProfilePage() {
    const { user, isOrganizer } = useAuth();
    const [profile, setProfile] = useState<ProviderProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [cards, setCards] = useState<OrganizerCard[]>([]);
    const [cardBusy, setCardBusy] = useState(false);
    const [cardMessage, setCardMessage] = useState('');

    const [companyName, setCompanyName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [website, setWebsite] = useState('');
    const [autoAcceptHighRatedTalents, setAutoAcceptHighRatedTalents] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        if (!isOrganizer) {
            setLoading(false);
            return;
        }
        getProviderProfileByUserId(user._id).then((p) => {
            if (p) {
                setProfile(p);
                setCompanyName(p.companyName);
                setDescription(p.description);
                setLocation(p.location);
                setPhone(formatEgyptianMobile(p.phone || ''));
                setWebsite(p.website);
                setAutoAcceptHighRatedTalents(p.autoAcceptHighRatedTalents);
            }
        }).catch((err) => setSaveError(err instanceof Error ? err.message : 'Could not load company profile.'))
            .finally(() => setLoading(false));
    }, [user, isOrganizer]);

    useEffect(() => {
        if (!user || !isOrganizer) return;
        let active = true;
        let timer: number | undefined;
        const loadCards = async () => {
            try {
                const nextCards = await getOrganizerCards();
                if (active) setCards(nextCards);
            } catch (error) {
                if (active) setCardMessage(error instanceof Error ? error.message : 'Could not load saved cards.');
            }
        };
        void loadCards();
        const enrollmentId = new URLSearchParams(window.location.search).get('cardEnrollment');
        if (enrollmentId) {
            let checks = 0;
            const poll = async () => {
                try {
                    const status = await getOrganizerCardEnrollment(enrollmentId);
                    if (!active) return;
                    if (status === 'completed') {
                        setCardMessage('Card saved for your organization.');
                        await loadCards();
                    } else if (status === 'failed') {
                        setCardMessage('Paymob did not save the card. Please try again.');
                    } else if (++checks < 10) {
                        setCardMessage('Waiting for Paymob to confirm the saved card…');
                        timer = window.setTimeout(poll, 2500);
                    } else {
                        setCardMessage('Card setup is still pending. Refresh this page to check again.');
                    }
                } catch (error) {
                    if (active) setCardMessage(error instanceof Error ? error.message : 'Could not check card setup.');
                }
            };
            void poll();
        }
        return () => { active = false; if (timer) window.clearTimeout(timer); };
    }, [user, isOrganizer]);

    const handleAddCard = async () => {
        setCardBusy(true);
        setCardMessage('');
        try {
            const enrollment = await startOrganizerCardEnrollment();
            window.location.assign(enrollment.checkoutUrl);
        } catch (error) {
            setCardMessage(error instanceof Error ? error.message : 'Could not start card setup.');
            setCardBusy(false);
        }
    };

    const handleSetDefaultCard = async (cardId: string) => {
        setCardBusy(true);
        try {
            await setDefaultOrganizerCard(cardId);
            setCards(await getOrganizerCards());
        } catch (error) {
            setCardMessage(error instanceof Error ? error.message : 'Could not change the default card.');
        } finally {
            setCardBusy(false);
        }
    };

    const handleRemoveCard = async (cardId: string) => {
        setCardBusy(true);
        try {
            await removeOrganizerCard(cardId);
            setCards(await getOrganizerCards());
        } catch (error) {
            setCardMessage(error instanceof Error ? error.message : 'Could not remove the card.');
        } finally {
            setCardBusy(false);
        }
    };

    if (loading) {
        return <ContentSkeleton variant="profile" />;
    }

    if (!isOrganizer) {
        return (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <Card className="max-w-md text-center p-8 border border-dark-700 bg-dark-950">
                    <ShieldAlert className="mx-auto text-danger-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-dark-50 mb-2">Access Denied</h2>
                    <p className="text-dark-400 text-sm mb-6">
                        Only the main organizer can access or modify the company profile.
                    </p>
                    <Link href="/provider/dashboard">
                        <Button variant="primary">Go to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const handleSave = async () => {
        if (!user) return;
        if (!companyName.trim() || !(logoPreview || profile?.logo) || !description.trim() || !location || !phone.trim()) {
            toast.error('Complete the company logo, name, description, location, and phone number.');
            return;
        }
        if (companyName.trim().length < 2 || companyName.trim().length > 100) {
            setSaveError('Company name must be 2 to 100 characters.');
            return;
        }
        if (description.length > 3000) {
            setSaveError('Description must be 3000 characters or fewer.');
            return;
        }
        if (website && !URL.canParse(website)) {
            setSaveError('Enter a valid website URL.');
            return;
        }
        if (!isEgyptianMobile(phone)) {
            setPhoneError('Enter a valid 11-digit Egyptian mobile number.');
            return;
        }
        setSaving(true);
        setSuccess(false);
        setSaveError('');
        try {
            const updateData: Partial<ProviderProfile> = {
                companyName,
                description,
                location,
                phone: internationalMobile(phone),
                website,
                autoAcceptHighRatedTalents,
            };
            if (logoPreview) updateData.logo = logoPreview;
            const updated = await updateProviderProfile(user._id, updateData);
            setProfile(updated);
            announceProfileUpdated();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Could not save company profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return <ContentSkeleton variant="profile" />;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-50">Company Profile</h1>
                    <p className="text-dark-400 mt-1">Manage your company information</p>
                </div>
                {success && <Badge variant="success">✓ Saved successfully</Badge>}
            </div>
            {saveError && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{saveError}</p>}

            {/* Avatar */}
            <Card className="flex items-center gap-6">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="hidden"
                />
                <div className="relative group">
                    <Avatar src={logoPreview || profile?.logo} name={companyName || 'Company'} size="xl" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-dark-50/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                        <Camera size={20} className="text-white" />
                    </button>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-dark-50">{companyName || 'Your Company'}</h3>
                    <p className="text-sm text-dark-400">{location || 'Your Location'}</p>
                </div>
            </Card>

            {/* Form */}
            <Card>
                <h3 className="text-sm font-semibold text-dark-300 mb-4">Company Details</h3>
                <div className="space-y-4">
                    <Input label="Company Name" minLength={2} maxLength={100} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-dark-300">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={3000}
                            rows={3}
                            placeholder="Tell talent about your company..."
                            className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-dark-300">Location</label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-dark-900 text-dark-100">Select city</option>
                                {CITIES.map((c) => <option key={c} value={c} className="bg-dark-900 text-dark-100">{c}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel-national"
                            dir="ltr"
                            value={phone}
                            error={phoneError}
                            onChange={(e) => { setPhone(formatEgyptianMobile(e.target.value)); setPhoneError(''); }}
                            placeholder="010 1234 5678"
                        />
                    </div>
                    <Input label="Website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
                </div>
            </Card>

            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center text-accent-600 dark:text-accent-400">
                            <Star size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-dark-50">Auto-accept &gt;4.5 applicants</h3>
                            <p className="mt-1 max-w-xl text-sm text-dark-400">
                                New applicants above 4.5 stars are accepted automatically while the event has open spots.
                            </p>
                        </div>
                    </div>
                    <label className="inline-flex w-fit items-center gap-3 rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-sm font-semibold text-dark-100">
                        <span>{autoAcceptHighRatedTalents ? 'On' : 'Off'}</span>
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={autoAcceptHighRatedTalents}
                            onChange={(e) => setAutoAcceptHighRatedTalents(e.target.checked)}
                        />
                        <span
                            aria-hidden="true"
                            className={`relative h-7 w-12 rounded-full transition-colors ${autoAcceptHighRatedTalents ? 'bg-primary-500' : 'bg-dark-700'}`}
                        >
                            <span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${autoAcceptHighRatedTalents ? 'translate-x-6' : 'translate-x-1'}`} />
                        </span>
                    </label>
                </div>
            </Card>

            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-dark-300">Saved test cards</h3>
                        <p className="mt-1 text-xs text-dark-400">Paymob holds the card details. Your organization can reuse a saved card at event checkout.</p>
                    </div>
                    <Button type="button" onClick={handleAddCard} isLoading={cardBusy} icon={<CreditCard size={16} />}>
                        Add card
                    </Button>
                </div>
                <p className="mt-3 text-xs text-dark-400">Adding a card opens Paymob for a 10 EGP sandbox transaction. No real money moves in Test mode. Select Save Card in Paymob Checkout.</p>
                {cardMessage && <p className="mt-3 text-sm text-warning-500">{cardMessage}</p>}
                <div className="mt-4 space-y-2">
                    {cards.length === 0 && <p className="text-sm text-dark-400">No cards saved yet.</p>}
                    {cards.map((card) => (
                        <div key={card._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-700 p-3">
                            <div className="flex items-center gap-3">
                                <CreditCard size={20} className="text-dark-300" />
                                <div>
                                    <p className="font-semibold text-dark-100">{card.cardSubtype || 'Card'} {card.maskedPan}</p>
                                    <p className="text-xs text-dark-400">{card.cardholderName || 'Saved with Paymob'}{card.expiryMonth && card.expiryYear ? ` · Expires ${card.expiryMonth}/${card.expiryYear}` : ''}</p>
                                </div>
                                {card.isDefault && <Badge variant="success">Default</Badge>}
                            </div>
                            <div className="flex gap-2">
                                {!card.isDefault && <Button type="button" size="sm" variant="secondary" isLoading={cardBusy} onClick={() => handleSetDefaultCard(card._id)}>Set default</Button>}
                                <Button type="button" size="sm" variant="danger" isLoading={cardBusy} onClick={() => handleRemoveCard(card._id)} aria-label={`Remove card ${card.maskedPan}`} icon={<Trash2 size={14} />}>Remove</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} isLoading={saving} icon={<Save size={16} />} size="lg">
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
