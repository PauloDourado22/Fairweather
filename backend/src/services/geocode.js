import fetch from 'node-fetch';
import { cached } from '../utils/cache.js';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Resolves a free-text city name (e.g. "Leiria") to coordinates.
 * Open-Meteo's geocoding endpoint is keyless, which is why it's the first
 * call in the pipeline — everything downstream needs lat/lon, not a name.
 */
export async function geocodeCity(name) {
  const key = `geocode:${name.toLowerCase()}`;
  return cached(key, async () => {
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geocoding upstream failed with status ${res.status}`);
    }
    const data = await res.json();
    const match = data.results?.[0];
    if (!match) {
      const err = new Error(`No location found for "${name}"`);
      err.status = 404;
      throw err;
    }
    return {
      name: match.name,
      country: match.country,
      admin1: match.admin1 ?? null,
      latitude: match.latitude,
      longitude: match.longitude,
      timezone: match.timezone,
    };
  }, 24 * 60 * 60 * 1000); // city coordinates never change — cache a full day
}
