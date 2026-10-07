'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Expand, MapPin } from 'lucide-react';
import { getEvent, getEventMap } from '@/lib/api';
import { Event, EventMap } from '@/types';
import EventMapCanvas from '@/components/events/EventMapCanvas';

export default function TalentEventMapPage() {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [map, setMap] = useState<EventMap | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        Promise.all([getEvent(id), getEventMap(id, 'talent')]).then(([item, data]) => {
            setEvent(item); setMap(data);
        }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load your map location.'))
            .finally(() => setLoading(false));
    }, [id]);
    if (loading) return <p className="text-dark-300">Loading your location…</p>;
    return <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div><Link href={`/talent/jobs/${id}`} className="text-sm text-primary-400 hover:underline">← Event details</Link>
                <h1 className="mt-2 text-2xl font-bold text-dark-50">{event?.title || 'Event'} map</h1>
                <p className="mt-1 text-sm text-dark-300">Your assigned location: <strong className="text-primary-400">{map?.pins.map((pin) => pin.name).join(', ') || '—'}</strong></p></div>
            {map?.imageUrl && <button type="button" onClick={() => mapRef.current?.requestFullscreen()} className="rounded-xl border border-dark-600 px-4 py-2 text-sm text-dark-100 focus-visible:outline-2 focus-visible:outline-primary-400"><Expand size={16} className="me-2 inline" />Full screen</button>}
        </div>
        {error && <p role="alert" className="rounded-xl border border-danger-500/40 bg-danger-500/10 p-4 text-sm text-danger-400">{error}</p>}
        {map && <div ref={mapRef} className="flex min-h-[460px] items-center justify-center rounded-xl border border-dark-700 bg-dark-900 p-3 sm:p-6 fullscreen:h-screen fullscreen:overflow-auto">
            {map.imageUrl ? <EventMapCanvas imageUrl={map.imageUrl} pins={map.pins} /> : <div className="text-center text-dark-400"><MapPin className="mx-auto mb-3" /><p>The organization has not uploaded a map yet.</p></div>}
        </div>}
    </div>;
}
