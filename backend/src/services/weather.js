import { cached } from '../utils/cache.js';
import { fetchWithRetry } from '../utils/fetchWithRetry.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetches current conditions + an hourly forecast + a 5-day daily forecast
 * for a coordinate pair, all in one request — Open-Meteo returns whatever
 * combination of `current`/`hourly`/`daily` blocks you ask for from a
 * single call, so adding hourly data (for the best-window feature) didn't
 * cost a second upstream request or a second cache entry.
 * Source: Open-Meteo Forecast API (https://open-meteo.com) — free, keyless,
 * no rate-limit key management needed, which matters for a portfolio demo
 * that has to keep working unattended.
 */
export async function getWeather(lat, lon) {
  const key = `weather:${lat.toFixed(2)},${lon.toFixed(2)}`;
  return cached(key, async () => {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code',
      hourly: 'temperature_2m,precipitation_probability,wind_speed_10m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '5',
    });
    const res = await fetchWithRetry(`${FORECAST_URL}?${params}`);
    if (!res.ok) {
      throw new Error(`Weather upstream failed with status ${res.status}`);
    }
    const data = await res.json();
    return {
      current: {
        // `timezone=auto` makes every timestamp in this response a naive
        // local-time string ("2026-07-19T14:00", no UTC offset) already
        // expressed in the city's own timezone. Keeping this one around is
        // what lets computeBestWindow find "the hourly buckets from now
        // onward" with plain string comparison instead of parsing dates.
        time: data.current.time,
        temperatureC: data.current.temperature_2m,
        feelsLikeC: data.current.apparent_temperature,
        precipitationMm: data.current.precipitation,
        windKph: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
      },
      hourly: data.hourly.time.map((time, i) => ({
        time,
        temperatureC: data.hourly.temperature_2m[i],
        precipitationChancePct: data.hourly.precipitation_probability[i],
        windKph: data.hourly.wind_speed_10m[i],
        weatherCode: data.hourly.weather_code[i],
      })),
      daily: data.daily.time.map((date, i) => ({
        date,
        weatherCode: data.daily.weather_code[i],
        maxTempC: data.daily.temperature_2m_max[i],
        minTempC: data.daily.temperature_2m_min[i],
        precipitationChancePct: data.daily.precipitation_probability_max[i],
      })),
    };
  });
}

// WMO weather codes -> short human labels, used by the frontend instead of
// showing a raw integer. Kept here (co-located with the service that returns
// the codes) rather than duplicated in the frontend.
export const WEATHER_CODE_LABELS = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  95: 'Thunderstorm',
};
