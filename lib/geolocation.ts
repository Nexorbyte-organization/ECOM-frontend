import { GeoLocation } from '@/types';

export class LocationError extends Error {
    constructor(message: string, readonly reason: 'unsupported' | 'denied' | 'unavailable') {
        super(message);
    }
}

const toLocation = (position: GeolocationPosition): GeoLocation => ({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null,
});

const toError = (error: GeolocationPositionError) => error.code === error.PERMISSION_DENIED
    ? new LocationError('Location is blocked. Allow location for this site in your browser settings, then try again.', 'denied')
    : new LocationError('Your location could not be found. Move to an open area or turn on precise location, then try again.', 'unavailable');

// Check-in requires the device location; the backend compares it with the staff phone or venue.
export function getCurrentLocation(timeoutMs = 15000): Promise<GeoLocation> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            reject(new LocationError('This browser cannot share your location. Open the link in Chrome or Safari.', 'unsupported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(toLocation(position)),
            (error) => reject(toError(error)),
            { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 },
        );
    });
}

// Resolves to null instead of failing, for places where location is only extra evidence.
export async function tryGetCurrentLocation(timeoutMs = 8000): Promise<GeoLocation | null> {
    try {
        return await getCurrentLocation(timeoutMs);
    } catch {
        return null;
    }
}

// Follows the device location; returns a function that stops watching.
export function watchLocation(onLocation: (location: GeoLocation) => void, onError: (error: LocationError) => void): () => void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        onError(new LocationError('This browser cannot share your location.', 'unsupported'));
        return () => undefined;
    }
    const id = navigator.geolocation.watchPosition(
        (position) => onLocation(toLocation(position)),
        (error) => onError(toError(error)),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
}
