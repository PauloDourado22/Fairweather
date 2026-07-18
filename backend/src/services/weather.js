import fetch from 'node-fetch';
import { cached } from '../utils/cache.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetches current conditions + a 5-day daily forecast for a coordinate pair.
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
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '5',
    });
    const res = await fetch(`${FORECAST_URL}?${params}`);
    if (!res.ok) {
      throw new Error(`Weather upstream failed with status ${res.status}`);
    }
    const data = await res.json();
    return {
      current: {
        temperatureC: data.current.temperature_2m,
        feelsLikeC: data.current.apparent_temperature,
        precipitationMm: data.current.precipitation,
        windKph: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
      },
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
