'use client';

import { useRef, type MouseEvent } from 'react';
import { EventMapPin } from '@/types';

export default function EventMapCanvas({ imageUrl, pins, onPlace, onSelect, selectedId }: {
    imageUrl: string;
    pins: EventMapPin[];
    onPlace?: (x: number, y: number) => void;
    onSelect?: (id: string) => void;
    selectedId?: string | null;
}) {
    const imageRef = useRef<HTMLImageElement>(null);
    const handlePlace = (event: MouseEvent<HTMLButtonElement>) => {
        if (!onPlace || !imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        onPlace(Math.min(100, Math.max(0, Math.round(((event.clientX - rect.left) / rect.width) * 10000) / 100)),
            Math.min(100, Math.max(0, Math.round(((event.clientY - rect.top) / rect.height) * 10000) / 100)));
    };
    return <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-2xl border border-dark-700 bg-dark-950 shadow-2xl">
        {/* The overlay follows the rendered image dimensions, so percentage positions survive resizing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={imageUrl} alt="Event location map" className="block h-auto max-h-[75vh] max-w-full" />
        {onPlace && <button type="button" onClick={handlePlace} aria-label="Place a pin on the map" className="absolute inset-0 z-10 h-full w-full cursor-crosshair focus-visible:outline-2 focus-visible:outline-primary-400" />}
        {pins.map((pin) => <button key={pin.id} type="button" onClick={() => onSelect?.(pin.id)}
            aria-label={`Location: ${pin.name}`} title={pin.name}
            className={`absolute z-20 rounded-full border-2 px-2 py-1 text-xs font-bold shadow-lg focus-visible:outline-2 focus-visible:outline-white ${pin.x < 15 ? '' : pin.x > 85 ? '-translate-x-full' : '-translate-x-1/2'} ${pin.y < 10 ? '' : '-translate-y-full'} ${pin.id === selectedId ? 'border-white bg-primary-500 text-on-primary' : 'border-white bg-dark-950 text-on-primary'}`}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
            <span aria-hidden="true">●</span><span className="ms-1">{pin.name}</span>
        </button>)}
    </div>;
}
