import { cached } from '../utils/cache.js';
import { fetchWithRetry } from '../utils/fetchWithRetry.js';

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/**
 * Fetches current PM2.5 / PM10 / US AQI for a coordinate pair.
 * This hits a *separate* Open-Meteo service (its own host, own uptime, own
 * rate limits) from the weather forecast — architecturally it's a distinct
 * upstream dependency, which is exactly why it gets its own service file and
 * its own try/catch boundary in the route layer: one provider being down
 * shouldn't take the whole dashboard down with it.
 */
export async function getAirQuality(lat, lon) {
  const key = `air:${lat.toFixed(2)},${lon.toFixed(2)}`;
  return cached(key, async () => {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'pm2_5,pm10,us_aqi',
      timezone: 'auto',
    });
    const res = await fetchWithRetry(`${AIR_QUALITY_URL}?${params}`);
    if (!res.ok) {
      throw new Error(`Air quality upstream failed with status ${res.status}`);
    }
    const data = await res.json();
    return {
      usAqi: data.current.us_aqi,
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
      category: categorizeAqi(data.current.us_aqi),
    };
  });
}

function categorizeAqi(aqi) {
  if (aqi == null) return 'unknown';
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy-for-sensitive-groups';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very-unhealthy';
  return 'hazardous';
}
