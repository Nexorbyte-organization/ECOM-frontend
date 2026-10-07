'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { updateEvent } from '@/lib/api';
import { EVENT_CATEGORIES, formatCurrency, getEventDays, maxStandbyCount, validateEventDays } from '@/lib/utils';
import { Event, EventDay, EventStatus, GenderPreference } from '@/types';
import { Lock } from 'lucide-react';
import VenuePinField, { MIN_PAY_PER_DAY_EGP, VenuePin } from '@/components/events/VenuePinField';
import EventDaysField from '@/components/events/EventDaysField';

type EventForm = {
    title: string; category: string; applicationDeadline: string;
    location: string; gatheringLocation: string;
    requiredCount: string; standbyCount: string; budget: string; specifyGenders: boolean; malesCount: string;
    femalesCount: string; genderPreference: GenderPreference; dressCode: string; notes: string;
};
type Field = keyof EventForm;

// Mirrors the backend rules: staffing and pay are fixed once applications close, and only
// on-site information can change after the event starts. Standby is unpaid, so its size stays
// editable until the start.
// The schedule (days) is edited separately: dates and times stay editable until the start, but the
// number of days only while the event is open, and days cannot be removed once ushers are hired.
const CONFIRMED_FIELDS: Field[] = ['title', 'location', 'gatheringLocation', 'dressCode', 'notes', 'standbyCount'];
const STARTED_FIELDS: Field[] = ['notes'];
const NUMBER_FIELDS: Field[] = ['requiredCount', 'standbyCount', 'budget', 'malesCount', 'femalesCount'];

const categoryKey = (value: string) => {
    const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    return key === 'sports_event' ? 'sport_event' : key;
};

export const eventHasStarted = (event: Event) =>
    new Date(`${event.eventDate.slice(0, 10)}T${event.startTime || '00:00'}`) <= new Date();

export const canEditEvent = (event: Event) =>
    event.status === EventStatus.OPEN || event.status === EventStatus.CONFIRMED;

const editableFields = (event: Event): Field[] | 'all' => {
    if (eventHasStarted(event)) return STARTED_FIELDS;
    if (event.status === EventStatus.CONFIRMED) return CONFIRMED_FIELDS;
    return 'all';
};

const toForm = (event: Event): EventForm => ({
    title: event.title,
    category: EVENT_CATEGORIES.find((c) => categoryKey(c) === categoryKey(event.category)) || event.category,
    applicationDeadline: event.applicationDeadline.slice(0, 10),
    location: event.location,
    gatheringLocation: event.gatheringLocation || '',
    requiredCount: String(event.requiredCount),
    standbyCount: String(event.standbyCount ?? 0),
    budget: String(event.budget),
    specifyGenders: Boolean(event.specifyGenders),
    malesCount: event.malesCount == null ? '' : String(event.malesCount),
    femalesCount: event.femalesCount == null ? '' : String(event.femalesCount),
    genderPreference: event.genderPreference,
    dressCode: event.dressCode || '',
    notes: event.notes || '',
});

interface EditEventModalProps {
    event: Event;
    onClose: () => void;
    onSaved: (event: Event) => void;
}

// Mount only while editing so the form starts from the latest event each time.
export default function EditEventModal({ event, onClose, onSaved }: EditEventModalProps) {
    const [initial] = useState(() => toForm(event));
    const [form, setForm] = useState(initial);
    const initialPin: VenuePin | null = event.venueLatitude != null && event.venueLongitude != null
        ? { latitude: event.venueLatitude, longitude: event.venueLongitude } : null;
    const [venuePin, setVenuePin] = useState<VenuePin | null>(initialPin);
    const pinChanged = venuePin?.latitude !== initialPin?.latitude || venuePin?.longitude !== initialPin?.longitude;
    const [initialDays] = useState(() => getEventDays(event));
    const [days, setDays] = useState<EventDay[]>(initialDays);
    const daysChanged = JSON.stringify(days) !== JSON.stringify(initialDays);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const editable = editableFields(event);
    const can = (field: Field) => editable === 'all' || editable.includes(field);
    const set = <K extends Field>(field: K, value: EventForm[K]) => setForm((current) => ({ ...current, [field]: value }));
    const hired = event.hiredTalents.length;
    const changed = (Object.keys(form) as Field[]).filter((field) => form[field] !== initial[field]);
    const canEditDays = editable !== STARTED_FIELDS;
    const nothingChanged = changed.length === 0 && !pinChanged && !daysChanged;

    const handleSave = async () => {
        setError('');
        if (nothingChanged) { onClose(); return; }
        const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
        if (daysChanged) {
            const scheduleError = validateEventDays(sortedDays);
            if (scheduleError) { setError(scheduleError); return; }
        }
        if (sortedDays[0]?.date && form.applicationDeadline && form.applicationDeadline >= sortedDays[0].date) {
            setError('Application deadline must be before the first event day.');
            return;
        }
        if (Number(form.requiredCount) < hired) {
            setError(`Staff count cannot be lower than the ${hired} ushers already hired.`);
            return;
        }
        const standbyLimit = maxStandbyCount(Number(form.requiredCount));
        if (!Number.isInteger(Number(form.standbyCount || 0)) || Number(form.standbyCount || 0) < 0 || Number(form.standbyCount || 0) > standbyLimit) {
            setError(`Standby must be a whole number from 0 to ${standbyLimit} (half the staff count, rounded up).`);
            return;
        }
        if (changed.includes('budget') && Number(form.budget) < MIN_PAY_PER_DAY_EGP) {
            setError(`Pay must be at least ${MIN_PAY_PER_DAY_EGP} EGP per usher for each event day.`);
            return;
        }
        if (hired > 0 && Number(form.budget) < event.budget) {
            setError('Pay cannot be lowered after ushers are hired.');
            return;
        }
        if (form.specifyGenders && Number(form.malesCount || 0) + Number(form.femalesCount || 0) !== Number(form.requiredCount)) {
            setError('Male and female counts must add up to the staff count.');
            return;
        }
        const payload: Record<string, unknown> = {};
        changed.forEach((field) => {
            payload[field] = NUMBER_FIELDS.includes(field) ? Number(form[field]) : form[field];
        });
        // The backend checks the gender split against the stored counts, so send it whole.
        if (form.specifyGenders && changed.some((field) => ['specifyGenders', 'malesCount', 'femalesCount', 'requiredCount'].includes(field))) {
            Object.assign(payload, {
                specifyGenders: true, malesCount: Number(form.malesCount || 0),
                femalesCount: Number(form.femalesCount || 0), requiredCount: Number(form.requiredCount),
            });
        }
        if (pinChanged) {
            Object.assign(payload, { venueLatitude: venuePin?.latitude ?? null, venueLongitude: venuePin?.longitude ?? null });
        }
        if (daysChanged) payload.days = sortedDays;
        setSaving(true);
        try {
            onSaved(await updateEvent(event._id, payload as Partial<Event>));
            onClose();
        } catch {
            // updateEvent already shows the backend's reason.
        } finally {
            setSaving(false);
        }
    };

    const lockedNote = editable === 'all'
        ? hired > 0 ? 'Pay can be raised but not lowered now that ushers are hired.' : null
        : editable === STARTED_FIELDS
            ? 'The event has started, so only the notes can change.'
            : 'Applications are closed, so staffing, pay, the number of days, category, and deadline are locked. Dates, times, and standby can still change until the start.';

    return (
        <Modal isOpen onClose={onClose} title="Edit event">
            <div className="space-y-4">
                {lockedNote && (
                    <p className="flex items-start gap-2 rounded-xl border border-dark-700 bg-dark-900/20 p-3 text-xs text-dark-300">
                        <Lock size={14} className="mt-0.5 shrink-0" /> {lockedNote}
                    </p>
                )}
                <Input label="Event title" value={form.title} onChange={(e) => set('title', e.target.value)} disabled={!can('title')} maxLength={100} />
                <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)} disabled={!can('category')}
                    options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
                <Input label="Application deadline" type="date" value={form.applicationDeadline} onChange={(e) => set('applicationDeadline', e.target.value)} disabled={!can('applicationDeadline')} />
                <EventDaysField days={days} onChange={setDays} disabled={!canEditDays}
                    fixedCount={event.status !== EventStatus.OPEN} minCount={hired > 0 ? initialDays.length : 1} />
                <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} disabled={!can('location')} />
                <Input label="Gathering location" value={form.gatheringLocation} onChange={(e) => set('gatheringLocation', e.target.value)} disabled={!can('gatheringLocation')} />
                <VenuePinField value={venuePin} onChange={setVenuePin} disabled={!can('location')} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Required staff" type="number" min={Math.max(1, hired)} value={form.requiredCount} onChange={(e) => set('requiredCount', e.target.value)} disabled={!can('requiredCount')} />
                    <div className="space-y-1">
                        <Input label="Pay per usher per day (EGP)" type="number" min={hired > 0 ? event.budget : MIN_PAY_PER_DAY_EGP} value={form.budget} onChange={(e) => set('budget', e.target.value)} disabled={!can('budget')} />
                        {days.length > 1 && Number(form.budget) > 0 && (
                            <p className="text-xs text-dark-400">{formatCurrency(Number(form.budget) * days.length)} per usher for {days.length} days</p>
                        )}
                    </div>
                    <Input label={`Standby ushers (up to ${maxStandbyCount(Number(form.requiredCount))})`} type="number" min={0} max={maxStandbyCount(Number(form.requiredCount))}
                        value={form.standbyCount} onChange={(e) => set('standbyCount', e.target.value)} disabled={!can('standbyCount')} />
                </div>
                <label className={`flex items-center gap-2 text-sm text-dark-200 ${can('specifyGenders') ? '' : 'opacity-60'}`}>
                    <input type="checkbox" checked={form.specifyGenders} onChange={(e) => set('specifyGenders', e.target.checked)} disabled={!can('specifyGenders')} />
                    Specify male and female counts
                </label>
                {form.specifyGenders ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Male ushers" type="number" min={0} value={form.malesCount} onChange={(e) => set('malesCount', e.target.value)} disabled={!can('malesCount')} />
                        <Input label="Female ushers" type="number" min={0} value={form.femalesCount} onChange={(e) => set('femalesCount', e.target.value)} disabled={!can('femalesCount')} />
                    </div>
                ) : (
                    <Select label="Gender preference" value={form.genderPreference} onChange={(e) => set('genderPreference', e.target.value as GenderPreference)} disabled={!can('genderPreference')}
                        options={[
                            { value: GenderPreference.ANY, label: 'Any' },
                            { value: GenderPreference.MALE, label: 'Male' },
                            { value: GenderPreference.FEMALE, label: 'Female' },
                        ]} />
                )}
                <Input label="Dress code" value={form.dressCode} onChange={(e) => set('dressCode', e.target.value)} disabled={!can('dressCode')} />
                <div className="space-y-1.5">
                    <label htmlFor="edit-event-notes" className="block text-sm font-medium text-dark-300">Notes</label>
                    <textarea
                        id="edit-event-notes"
                        value={form.notes}
                        onChange={(e) => set('notes', e.target.value)}
                        rows={3}
                        className="w-full bg-dark-950 border-2 border-dark-50 rounded-xl px-4 py-2.5 text-sm text-dark-100 placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                    />
                </div>
                {hired > 0 && <p className="text-xs text-dark-400">Hired ushers are notified when the dates, times, location, meeting point, pay, or dress code change.</p>}
                {error && <p role="alert" className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
                <div className="flex justify-end gap-3 border-t border-dark-700 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={saving} disabled={nothingChanged}>Save changes</Button>
                </div>
            </div>
        </Modal>
    );
}
