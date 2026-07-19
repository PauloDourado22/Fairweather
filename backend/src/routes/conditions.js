import { Router } from 'express';
import { geocodeCity } from '../services/geocode.js';
import { getWeather, WEATHER_CODE_LABELS } from '../services/weather.js';
import { getAirQuality } from '../services/airQuality.js';
import { getDaylight } from '../services/daylight.js';
import { computeActivityScore, computeBestWindow } from '../services/activityScore.js';

export const conditionsRouter = Router();

/**
 * GET /api/conditions?city=Leiria&wTemp=35&wPrecip=30&wAqi=25&wWind=10
 *
 * This is the aggregation endpoint: one request in, three upstream calls out
 * (run in parallel with Promise.allSettled), one unified response back. The
 * frontend never talks to Open-Meteo or sunrise-sunset.org directly — it only
 * knows about this API. That indirection is the whole point of having a
 * backend here instead of calling these APIs straight from the browser:
 * we control caching, we can add a 4th provider later without touching the
 * frontend, and we don't leak upstream outages straight to the UI.
 *
 * The four w* params are optional and don't need to sum to anything in
 * particular — computeActivityScore normalizes whatever it's given. This is
 * what backs the "tune the score" panel in the UI: the client sends its
 * current slider values on every request instead of the server holding any
 * per-user config, so there's no state to keep in sync anywhere.
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

    const weights = parseWeights(req.query);
    const activity =
      weather && airQuality ? computeActivityScore({ weather, airQuality, weights }) : null;
    const bestWindow =
      weather && airQuality ? computeBestWindow({ weather, airQuality, weights }) : null;

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
      bestWindow,
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

// Returns undefined (not a partial object) when none of the four params are
// present, so computeActivityScore's own "no weights passed" default path
// runs untouched instead of normalizing four undefineds.
function parseWeights(query) {
  const keys = ['wTemp', 'wPrecip', 'wAqi', 'wWind'];
  if (!keys.some((k) => query[k] !== undefined)) return undefined;
  return {
    temperature: query.wTemp,
    precipitationChance: query.wPrecip,
    airQuality: query.wAqi,
    wind: query.wWind,
  };
}
