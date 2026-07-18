import fetch from 'node-fetch';
import { cached } from '../utils/cache.js';

const SUNRISE_SUNSET_URL = 'https://api.sunrise-sunset.org/json';

/**
 * Fetches sunrise, sunset, and day length from sunrise-sunset.org — a third,
 * independent provider. This is the piece that turns "weather app" into
 * "outdoor conditions dashboard": knowing daylight window matters as much as
 * temperature if you're planning a hike or a run.
 */
export async function getDaylight(lat, lon) {
  const key = `daylight:${lat.toFixed(2)},${lon.toFixed(2)}`;
  return cached(key, async () => {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lon),
      formatted: '0', // ISO 8601 timestamps instead of "7:12:34 AM"
    });
    const res = await fetch(`${SUNRISE_SUNSET_URL}?${params}`);
    if (!res.ok) {
      throw new Error(`Sunrise-sunset upstream failed with status ${res.status}`);
    }
    const data = await res.json();
    if (data.status !== 'OK') {
      throw new Error(`Sunrise-sunset upstream returned status ${data.status}`);
    }
    return {
      sunrise: data.results.sunrise,
      sunset: data.results.sunset,
      dayLengthSeconds: data.results.day_length,
    };
  }, 12 * 60 * 60 * 1000); // sunrise/sunset barely shifts within a day — cache 12h
}
