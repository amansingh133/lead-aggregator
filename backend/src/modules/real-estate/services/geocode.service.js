/**
 * Reverse-geocodes lat/lng into a human-readable address using the free
 * OpenStreetMap Nominatim API. This is only a FALLBACK — the Android app
 * should ideally do reverse geocoding on-device (via Android's Geocoder /
 * Google's Geocoding API) and send the resolved `address` string directly
 * in the check-in/check-out payload, since that's faster, works offline-ish,
 * and isn't rate-limited.
 *
 * This function must never throw — attendance punches should never fail
 * just because a free public geocoding API is slow or down.
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires an identifying User-Agent.
        'User-Agent': 'RealEstateLeadCRM/1.0 (attendance-module)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return 'Address unavailable';

    const data = await response.json();
    return data?.display_name || 'Address unavailable';
  } catch (error) {
    return 'Address unavailable';
  }
};
