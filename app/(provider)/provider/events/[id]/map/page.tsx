'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Expand, ImagePlus, MapPin, Trash2 } from 'lucide-react';
import { createEventMapPin, deleteEventMapPin, getEvent, getEventMap, updateEventMapPin, uploadEventMap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Event, EventMap } from '@/types';
import EventMapCanvas from '@/components/events/EventMapCanvas';

export default function ProviderEventMapPage() {
    const { id } = useParams<{ id: string }>();
    const { isOrganizer } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [map, setMap] = useState<EventMap | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<HTMLDivElement>(null);
    const selected = map?.pins.find((pin) => pin.id === selectedId);

    useEffect(() => {
        Promise.all([getEvent(id), getEventMap(id, 'provider')]).then(([item, data]) => {
            setEvent(item); setMap(data);
        }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load map.'))
            .finally(() => setLoading(false));
    }, [id]);

    const run = async (action: () => Promise<EventMap>) => {
        setBusy(true); setError('');
        try { setMap(await action()); return true; } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save map.'); return false; }
        finally { setBusy(false); }
    };
    const place = async () => {
        if (!draft || !name.trim()) return;
        if (await run(() => createEventMapPin(id, { ...draft, name: name.trim() }))) {
            setDraft(null); setName('');
        }
    };
    const assign = (usherId: string) => {
        if (!selected) return;
        const current = selected.usherIds || [];
        const usherIds = current.includes(usherId) ? current.filter((item) => item !== usherId) : [...current, usherId];
        run(() => updateEventMapPin(id, selected.id, { usherIds }));
    };

    if (loading) return <p className="text-dark-300">Loading event map…</p>;
    return <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div><Link href={`/provider/events/${id}`} className="text-sm text-primary-400 hover:underline">← Event details</Link>
                <h1 className="mt-2 text-2xl font-bold text-dark-50">{event?.title || 'Event'} map</h1>
                <p className="mt-1 text-sm text-dark-400">Place locations on the floor plan and assign hired ushers.</p></div>
            <div className="flex flex-wrap gap-2">
                {map?.imageUrl && <button type="button" onClick={() => mapRef.current?.requestFullscreen()} className="rounded-xl border border-dark-600 px-4 py-2 text-sm text-dark-100 focus-visible:outline-2 focus-visible:outline-primary-400"><Expand size={16} className="me-2 inline" />Full screen</button>}
                {isOrganizer && <label className="inline-flex cursor-pointer items-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-on-primary focus-within:outline-2 focus-within:outline-white"><ImagePlus size={16} className="me-2" />{map?.imageUrl ? 'Replace map' : 'Upload map'}<input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) run(() => uploadEventMap(id, file)); e.target.value = ''; }} /></label>}
            </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-danger-500/40 bg-danger-500/10 p-3 text-sm text-danger-400">{error}</p>}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div ref={mapRef} className="flex min-h-[460px] items-center justify-center rounded-xl border border-dark-700 bg-dark-900 p-3 sm:p-6 fullscreen:h-screen fullscreen:overflow-auto">
                {map?.imageUrl ? <EventMapCanvas imageUrl={map.imageUrl} pins={map.pins} selectedId={selectedId} onSelect={setSelectedId} onPlace={isOrganizer ? (x, y) => { setDraft({ x, y }); setSelectedId(null); } : undefined} />
                    : <div className="text-center text-dark-400"><MapPin className="mx-auto mb-3" size={34} /><p>Upload a floor plan to start placing pins.</p><p className="mt-1 text-xs">PNG or JPEG, up to 5 MB</p></div>}
            </div>
            <aside className="space-y-4 rounded-xl border border-dark-700 bg-dark-900 p-5">
                {draft && isOrganizer && <form onSubmit={(e) => { e.preventDefault(); void place(); }} className="space-y-3">
                    <h2 className="font-semibold text-dark-50">New location</h2>
                    <label className="block text-sm text-dark-200">Pin name<input autoFocus value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-950 p-2 text-dark-50" placeholder="e.g. North entrance" /></label>
                    <div className="flex gap-2"><button disabled={busy || !name.trim()} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">Add pin</button><button type="button" onClick={() => setDraft(null)} className="text-sm text-dark-300">Cancel</button></div>
                </form>}
                {selected && <div className="space-y-4"><div className="flex items-start justify-between gap-2"><h2 className="min-w-0 break-words font-semibold text-dark-50">{selected.name}</h2>{isOrganizer && <button type="button" aria-label={`Delete ${selected.name}`} title="Delete pin" disabled={busy} onClick={() => { if (window.confirm(`Delete “${selected.name}”?`)) { run(() => deleteEventMapPin(id, selected.id)); setSelectedId(null); } }} className="text-danger-400 focus-visible:outline-2 focus-visible:outline-danger-400"><Trash2 size={18} /></button>}</div>
                    {isOrganizer && <><label className="block text-sm text-dark-300">Rename location<input key={selected.id} defaultValue={selected.name} maxLength={80} onBlur={(e) => { const value = e.target.value.trim(); if (value && value !== selected.name) run(() => updateEventMapPin(id, selected.id, { name: value })); }} className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-950 p-2 text-dark-50" /></label>
                        <div><h3 className="mb-2 text-sm font-semibold text-dark-200">Assign ushers</h3>{map?.ushers?.length ? <div className="max-h-64 space-y-2 overflow-auto">{map.ushers.map((usher) => <label key={usher.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-dark-700 p-2 text-sm text-dark-100"><input type="checkbox" checked={selected.usherIds?.includes(usher.id) || false} disabled={busy || map.pins.some((pin) => pin.id !== selected.id && pin.usherIds?.includes(usher.id))} onChange={() => assign(usher.id)} />{usher.name}</label>)}</div> : <p className="text-sm text-dark-400">No hired ushers yet.</p>}</div></>}
                </div>}
                {!selected && !draft && <div><h2 className="font-semibold text-dark-50">Locations</h2><p className="mt-1 text-sm text-dark-400">{isOrganizer ? 'Click the map to add a pin, or select an existing pin.' : 'Select a pin to view its assignment.'}</p></div>}
                {!!map?.pins.length && <div className="border-t border-dark-700 pt-3"><ul className="space-y-1">{map.pins.map((pin) => <li key={pin.id}><button type="button" onClick={() => { setDraft(null); setSelectedId(pin.id); }} className="w-full rounded-lg p-2 text-start text-sm text-dark-200 hover:bg-dark-800 focus-visible:outline-2 focus-visible:outline-primary-400">{pin.name} <span className="text-dark-500">· {pin.usherIds?.length || 0} ushers</span></button></li>)}</ul></div>}
            </aside>
        </div>
    </div>;
}
