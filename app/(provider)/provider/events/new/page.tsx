'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createEvent, getProviderProfileByUserId } from '@/lib/api';
import { GenderPreference } from '@/types';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { EVENT_CATEGORIES, cn, maxStandbyCount } from '@/lib/utils';
import { CalendarPlus, ArrowLeft, Camera, Trash2, Upload, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useProfileCompletion } from '@/components/shared/ProfileCompletionGate';
import VenuePinField, { MIN_PAY_PER_DAY_EGP, VenuePin } from '@/components/events/VenuePinField';

export default function CreateEventPage() {
    const { user } = useAuth();
    const { isComplete: isProfileComplete, isChecking: isCheckingProfile } = useProfileCompletion();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [applicationDeadline, setApplicationDeadline] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [gatheringLocation, setGatheringLocation] = useState('');
    const [venuePin, setVenuePin] = useState<VenuePin | null>(null);
    const [photo, setPhoto] = useState('');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [requiredCount, setRequiredCount] = useState('');
    const [standbyCount, setStandbyCount] = useState('');
    const [budget, setBudget] = useState('');
    const [specifyGenders, setSpecifyGenders] = useState(false);
    const [malesCount, setMalesCount] = useState('');
    const [femalesCount, setFemalesCount] = useState('');
    const [genderPreference, setGenderPreference] = useState<GenderPreference>(GenderPreference.ANY);

    const [dressCode, setDressCode] = useState('');
    const [notes, setNotes] = useState('');
    const [whatsappGroupLink, setWhatsappGroupLink] = useState('');

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPhoto(result);
            setPhotoPreview(result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setPhoto('');
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError('');

        if (!isProfileComplete) {
            setError('Complete your company profile before creating an event.');
            return;
        }

        const reqCount = Number(requiredCount);
        const bgt = Number(budget);

        if (!Number.isInteger(reqCount) || reqCount < 1) {
            setError('Required staff count must be a whole number of at least 1');
            return;
        }

        const standby = Number(standbyCount || 0);
        if (!Number.isInteger(standby) || standby < 0 || standby > maxStandbyCount(reqCount)) {
            setError(`Standby must be a whole number from 0 to ${maxStandbyCount(reqCount)} (half the staff count, rounded up)`);
            return;
        }

        if (!Number.isFinite(bgt) || bgt < MIN_PAY_PER_DAY_EGP) {
            setError(`Pay must be at least ${MIN_PAY_PER_DAY_EGP} EGP per usher for each event day`);
            return;
        }

        const now = new Date();
        const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        if (eventDate < todayStr) {
            setError('Event date cannot be in the past');
            return;
        }

        if (applicationDeadline >= eventDate) {
            setError('Application deadline must be before the event date');
            return;
        }

        if (specifyGenders) {
            const males = Number(malesCount);
            const females = Number(femalesCount);
            if (!Number.isInteger(males) || males < 0) {
                setError('Male staff count must be a whole number');
                return;
            }
            if (!Number.isInteger(females) || females < 0) {
                setError('Female staff count must be a whole number');
                return;
            }
            if (males + females !== reqCount) {
                setError(`The sum of males (${males}) and females (${females}) must equal the total required staff (${reqCount}).`);
                return;
            }
        }

        setSaving(true);

        try {
            const profile = await getProviderProfileByUserId(user._id);
            if (!profile) throw new Error('Provider profile not found');

            await createEvent({
                providerId: profile._id,
                title,
                category,
                eventDate,
                applicationDeadline,
                startTime,
                endTime,
                location,
                gatheringLocation: gatheringLocation || undefined,
                ...(venuePin ? { venueLatitude: venuePin.latitude, venueLongitude: venuePin.longitude } : {}),
                photo: photo || undefined,
                requiredCount: reqCount,
                standbyCount: standby,
                specifyGenders,
                malesCount: specifyGenders ? Number(malesCount) : undefined,
                femalesCount: specifyGenders ? Number(femalesCount) : undefined,
                genderPreference: specifyGenders ? GenderPreference.ANY : genderPreference,
                budget: bgt,
                dressCode,
                notes,
                whatsappGroupLink: whatsappGroupLink.trim() || undefined,
            });

            router.push('/provider/events');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create event');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <Link href="/provider/events" className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors">
                <ArrowLeft size={16} /> Back to events
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-dark-50">Create New Event</h1>
                <p className="text-dark-400 mt-1">Fill in the details to post a new event listing</p>
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Photo */}
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">Event Photo (Optional)</h3>
                    <div className="flex items-center gap-6">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            accept="image/*"
                            className="hidden"
                        />
                        {photoPreview ? (
                            <div className="relative group w-full h-48 rounded-xl overflow-hidden border border-dark-700 bg-dark-800">
                                <img
                                    src={photoPreview}
                                    alt="Event preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all cursor-pointer"
                                        title="Change photo"
                                    >
                                        <Camera size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="p-2.5 rounded-xl bg-danger-500/80 hover:bg-danger-500 text-white transition-all cursor-pointer"
                                        title="Remove photo"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 rounded-xl border-2 border-dashed border-dark-700 hover:border-primary-500/50 bg-dark-800/20 hover:bg-dark-800/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                            >
                                <div className="p-2 rounded-lg bg-dark-800 text-dark-400 group-hover:text-primary-400">
                                    <Upload size={20} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-dark-200">Upload event banner image</p>
                                    <p className="text-[10px] text-dark-500 mt-0.5">PNG, JPG, or WEBP up to 5MB</p>
                                </div>
                            </button>
                        )}
                    </div>
                </Card>

                {/* Basic Info */}
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">Event Information</h3>
                    <div className="space-y-4">
                        <Input label="Event Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Tech Summit 2026 - Staff Needed" required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-dark-300">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    required
                                    className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-dark-900 text-dark-100">Select category</option>
                                    {EVENT_CATEGORIES.map((c) => <option key={c} value={c} className="bg-dark-900 text-dark-100">{c}</option>)}
                                </select>
                            </div>
                            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue name, city" required />
                        </div>
                        <Input label="Gathering Location (Optional)" value={gatheringLocation} onChange={(e) => setGatheringLocation(e.target.value)} placeholder="e.g., Hall 4 Gate 2 / Main Entrance lobby" />
                        <VenuePinField value={venuePin} onChange={setVenuePin} />
                    </div>
                </Card>

                {/* Schedule */}
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input label="Event Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                        <Input label="Application Deadline" type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                        <Input label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                    </div>
                </Card>

                {/* Requirements */}
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">Requirements</h3>
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                                label="Required Staff (Overall Count)" 
                                type="number" 
                                value={requiredCount} 
                                onChange={(e) => setRequiredCount(e.target.value)} 
                                placeholder="e.g., 10" 
                                required 
                            />
                            <div className="space-y-1">
                                <Input
                                    label="Standby ushers (optional)"
                                    type="number"
                                    min={0}
                                    max={maxStandbyCount(Number(requiredCount))}
                                    value={standbyCount}
                                    onChange={(e) => setStandbyCount(e.target.value)}
                                    placeholder={`Up to ${maxStandbyCount(Number(requiredCount))}`}
                                />
                                <p className="text-[11px] text-dark-400 leading-normal">
                                    Unpaid and on call. If a hired usher drops out before the start, the next one on standby is moved in automatically. Only ushers who agree to standby can be added.
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Input 
                                    label="Pay per usher (EGP)" 
                                    type="number" 
                                    min={MIN_PAY_PER_DAY_EGP}
                                    value={budget} 
                                    onChange={(e) => setBudget(e.target.value)} 
                                    placeholder={`At least ${MIN_PAY_PER_DAY_EGP} per day`} 
                                    required 
                                />
                                {budget && !isNaN(Number(budget)) && Number(budget) > 0 && (
                                    <p className="text-[11px] text-dark-400 leading-normal mt-1 bg-dark-900/20 border border-dark-800 rounded-xl p-2.5">
                                        Usher receives: <strong className="text-success-400">{Number(budget) * 0.95} EGP</strong> (95%) <br/>
                                        Platform commission: <strong className="text-dark-300">{Number(budget) * 0.05} EGP</strong> (5%)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Gender Selection */}
                        <div className="pt-3 border-t border-dark-700/30 space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="specifyGenders"
                                    checked={specifyGenders}
                                    onChange={(e) => {
                                        setSpecifyGenders(e.target.checked);
                                        if (!e.target.checked) {
                                            setMalesCount('');
                                            setFemalesCount('');
                                        }
                                    }}
                                    className="w-4.5 h-4.5 rounded border-dark-700 text-primary-500 focus:ring-primary-500/50 cursor-pointer"
                                />
                                <label htmlFor="specifyGenders" className="text-sm font-medium text-dark-200 cursor-pointer">
                                    Do you want to specify exact gender counts?
                                </label>
                            </div>

                            {specifyGenders ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                    <Input
                                        label="Male Ushers Needed"
                                        type="number"
                                        value={malesCount}
                                        onChange={(e) => setMalesCount(e.target.value)}
                                        placeholder="e.g., 5"
                                        required
                                    />
                                    <Input
                                        label="Female Ushers Needed"
                                        type="number"
                                        value={femalesCount}
                                        onChange={(e) => setFemalesCount(e.target.value)}
                                        placeholder="e.g., 5"
                                        required
                                    />
                                    {requiredCount && (malesCount || femalesCount) && (
                                        <div className={cn(
                                            "md:col-span-2 text-xs p-2.5 rounded-lg border",
                                            (Number(malesCount) + Number(femalesCount) === Number(requiredCount))
                                                ? "bg-success-500/10 border-success-500/20 text-success-400"
                                                : "bg-warning-500/10 border-warning-500/20 text-warning-400"
                                        )}>
                                            Gender sum: {Number(malesCount) + Number(femalesCount)} / {requiredCount} total staff 
                                            {Number(malesCount) + Number(femalesCount) !== Number(requiredCount) && " (Must be equal)"}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-1.5 md:w-1/2 animate-fade-in">
                                    <label className="block text-sm font-medium text-dark-300">Gender Preference</label>
                                    <select
                                        value={genderPreference}
                                        onChange={(e) => setGenderPreference(e.target.value as GenderPreference)}
                                        className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="any" className="bg-dark-900 text-dark-100">Any</option>
                                        <option value="male" className="bg-dark-900 text-dark-100">Male</option>
                                        <option value="female" className="bg-dark-900 text-dark-100">Female</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Additional */}
                <Card>
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4">Additional Details</h3>
                    <div className="space-y-4">
                        <Input label="Dress Code" value={dressCode} onChange={(e) => setDressCode(e.target.value)} placeholder="e.g., Business formal — black suit" />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-dark-300">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Additional instructions or requirements..."
                                className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                            />
                        </div>
                        <div className="space-y-1.5 border-t border-dark-700/40 pt-4">
                            <label className="block text-sm font-medium text-dark-300 flex items-center gap-2">
                                <MessageCircle size={15} className="text-emerald-600" />
                                WhatsApp Group Link <span className="text-dark-500 font-normal">(Optional)</span>
                            </label>
                            <Input
                                type="url"
                                value={whatsappGroupLink}
                                onChange={(e) => setWhatsappGroupLink(e.target.value)}
                                placeholder="https://chat.whatsapp.com/..."
                            />
                            <p className="text-xs text-dark-500">Only accepted ushers will see this link. You can also add or update it later from the event details page.</p>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" isLoading={saving} disabled={isCheckingProfile || !isProfileComplete} icon={<CalendarPlus size={16} />} size="lg">
                        {isProfileComplete ? 'Create Event' : 'Complete Profile to Create'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
