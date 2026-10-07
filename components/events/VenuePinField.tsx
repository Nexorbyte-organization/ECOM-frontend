'use client';

import React, { useState } from 'react';
import { LocateFixed, MapPin, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getCurrentLocation } from '@/lib/geolocation';

// Pay must be at least this much per usher for each event day (enforced by the backend).
export const MIN_PAY_PER_DAY_EGP = 600;

export interface VenuePin { latitude: number; longitude: number }

// Optional venue pin: ushers within range of it can check in with "I'm here" even when no
// staff phone is nearby. Set it while standing at the venue.
export default function VenuePinField({ value, onChange, disabled = false }: {
    value: VenuePin | null;
    onChange: (pin: VenuePin | null) => void;
    disabled?: boolean;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const pinHere = async () => {
        setBusy(true);
        setError('');
        try {
            const location = await getCurrentLocation();
            onChange({ latitude: location.latitude, longitude: location.longitude });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not read your location.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={`space-y-1.5 ${disabled ? 'opacity-60' : ''}`}>
            <p className="text-sm font-medium text-dark-300">Venue pin <span className="font-normal text-dark-500">(optional)</span></p>
            <div className="flex flex-wrap items-center gap-2">
                {value ? (
                    <>
                        <a href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary-500 hover:underline">
                            <MapPin size={14} /> {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
                        </a>
                        <Button type="button" size="sm" variant="ghost" icon={<X size={14} />} disabled={disabled} onClick={() => onChange(null)}>Remove</Button>
                    </>
                ) : (
                    <Button type="button" size="sm" variant="secondary" icon={<LocateFixed size={14} />} isLoading={busy} disabled={disabled} onClick={pinHere}>
                        Pin my current location
                    </Button>
                )}
            </div>
            <p className="text-xs text-dark-500">Set it while you are at the venue. Ushers within 200 m of it can check in with “I’m here” even when no staff phone is nearby.</p>
            {error && <p role="alert" className="text-xs text-danger-400">{error}</p>}
        </div>
    );
}
