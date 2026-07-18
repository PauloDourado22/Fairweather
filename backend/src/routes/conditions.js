import { Router } from 'express';
import { geocodeCity } from '../services/geocode.js';
import { getWeather, WEATHER_CODE_LABELS } from '../services/weather.js';
import { getAirQuality } from '../services/airQuality.js';
import { getDaylight } from '../services/daylight.js';
import { computeActivityScore } from '../services/activityScore.js';

export const conditionsRouter = Router();

/**
 * GET /api/conditions?city=Leiria
 *
 * This is the aggregation endpoint: one request in, three upstream calls out
 * (run in parallel with Promise.allSettled), one unified response back. The
 * frontend never talks to Open-Meteo or sunrise-sunset.org directly — it only
 * knows about this API. That indirection is the whole point of having a
 * backend here instead of calling these APIs straight from the browser:
 * we control caching, we can add a 4th provider later without touching the
 * frontend, and we don't leak upstream outages straight to the UI.
 */
conditionsRouter.get('/', async (req, res) => {
  const city = req.query.city;
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'Query parameter "city" is required.' });
  }

  try {
    const location = await geocodeCity(city);

    // Promise.allSettled (not Promise.all) on purpose: if the air-quality
    // provider is down, we still want to return weather + daylight instead
    // of failing the whole request over one flaky upstream.
    const [weatherResult, airResult, daylightResult] = await Promise.allSettled([
      getWeather(location.latitude, location.longitude),
      getAirQuality(location.latitude, location.longitude),
      getDaylight(location.latitude, location.longitude),
    ]);

    const weather = unwrap(weatherResult);
    const airQuality = unwrap(airResult);
    const daylight = unwrap(daylightResult);

    const activity =
      weather && airQuality ? computeActivityScore({ weather, airQuality }) : null;

    res.json({
      location,
      weather: weather
        ? {
            ...weather,
            current: {
              ...weather.current,
              conditionLabel: WEATHER_CODE_LABELS[weather.current.weatherCode] ?? 'Unknown',
            },
          }
        : { error: 'Weather provider unavailable' },
      airQuality: airQuality ?? { error: 'Air quality provider unavailable' },
      daylight: daylight ?? { error: 'Daylight provider unavailable' },
      activityScore: activity,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const status = err.status ?? 502;
    res.status(status).json({ error: err.message });
  }
});

function unwrap(settledResult) {
  return settledResult.status === 'fulfilled' ? settledResult.value : null;
}
