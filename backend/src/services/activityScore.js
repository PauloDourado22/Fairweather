/**
 * Derives a single 0-100 "good time to be outside" score from the three raw
 * feeds. This is the one piece of real business logic in the app — without
 * it, this is just three API passthroughs stitched together, which isn't
 * something a client would pay for. With it, the API is producing an
 * opinion, not just data.
 *
 * The weights below are a reasonable starting point, not a scientifically
 * derived model — worth saying out loud in an interview or to a client
 * rather than presenting it as more rigorous than it is. They're also not
 * hardcoded: callers can pass their own via `weights`, which is the whole
 * point of the config panel in the UI — the scoring *pattern* (four signals
 * in, one weighted opinion out) is the reusable part, not these specific
 * numbers.
 */
export const DEFAULT_WEIGHTS = {
  temperature: 0.35,
  precipitationChance: 0.3,
  airQuality: 0.25,
  wind: 0.1,
};

export function computeActivityScore({ weather, airQuality, weights }) {
  const w = normalizeWeights(weights);

  const tempScore = scoreTemperature(weather.current.temperatureC);
  const precipScore = scorePrecipitationChance(
    weather.daily[0]?.precipitationChancePct ?? 0
  );
  const aqiScore = scoreAqi(airQuality.usAqi);
  const windScore = scoreWind(weather.current.windKph);

  const weighted =
    tempScore * w.temperature +
    precipScore * w.precipitationChance +
    aqiScore * w.airQuality +
    windScore * w.wind;

  return {
    score: Math.round(weighted),
    label: labelFor(weighted),
    weights: w,
    breakdown: {
      temperature: tempScore,
      precipitationChance: precipScore,
      airQuality: aqiScore,
      wind: windScore,
    },
  };
}

const LOOKAHEAD_HOURS = 18; // roughly a full waking day ahead, without
// reaching so far out that hourly forecast accuracy starts to degrade.
const WINDOW_SIZE_HOURS = 2;

/**
 * Scans the next ~18 hours of forecast and finds the best-scoring
 * contiguous 2-hour block, using the exact same per-signal scoring
 * (temperature/rain/wind, weighted the same way) that produces the
 * headline score. This is what turns the app from "here's today's
 * weather" into "go outside at 14:00" — the actual differentiator the
 * weighting panel is trying to demonstrate, not just a bigger number.
 *
 * Air quality is held constant at the current reading rather than fetched
 * per-hour: Open-Meteo's air quality API does support an hourly endpoint,
 * but AQI moves far more slowly than temperature or rain, and fetching it
 * per-hour would mean a second upstream call for marginal accuracy. Worth
 * revisiting if this ever needs to defend that precision.
 *
 * Every comparison here is a plain string comparison on Open-Meteo's
 * "YYYY-MM-DDTHH:mm" local-time strings (from `timezone=auto`), never a
 * `Date` object — parsing those through `Date` would silently reinterpret
 * a city's local time in whatever timezone the code happens to run in
 * (the same class of bug already hit once in this app, for the header's
 * "today" date). ISO strings in this exact format sort correctly as
 * plain text, including across midnight, so there's no need to parse them
 * at all just to compare or window over them.
 */
export function computeBestWindow({ weather, airQuality, weights }) {
  const hourly = weather?.hourly;
  const now = weather?.current?.time;
  if (!hourly || !now) return null;

  const upcoming = hourly.filter((h) => h.time >= now).slice(0, LOOKAHEAD_HOURS);
  if (upcoming.length <= WINDOW_SIZE_HOURS) return null;

  const w = normalizeWeights(weights);
  const aqiScore = scoreAqi(airQuality?.usAqi);

  const scored = upcoming.map((h) => ({
    time: h.time,
    score:
      scoreTemperature(h.temperatureC) * w.temperature +
      scorePrecipitationChance(h.precipitationChancePct ?? 0) * w.precipitationChance +
      aqiScore * w.airQuality +
      scoreWind(h.windKph) * w.wind,
  }));

  let best = null;
  for (let i = 0; i + WINDOW_SIZE_HOURS < scored.length; i++) {
    const slice = scored.slice(i, i + WINDOW_SIZE_HOURS);
    const avg = slice.reduce((sum, s) => sum + s.score, 0) / slice.length;
    if (!best || avg > best.avg) {
      // The point right after the window is its end boundary — reading it
      // off the array instead of computing "start + N hours" is what keeps
      // this free of Date math entirely.
      best = { avg, start: slice[0].time, end: scored[i + WINDOW_SIZE_HOURS].time };
    }
  }
  if (!best) return null;

  return { start: best.start, end: best.end, score: Math.round(best.avg) };
}

/**
 * Accepts whatever a caller sends — arbitrary positive numbers, not
 * necessarily summing to 1 — and always returns four fractions that sum to
 * 1. This is what lets the frontend send raw slider values (e.g. 40/30/20/10)
 * without pre-normalizing them, and what protects the score math from
 * garbage/missing input: anything invalid falls back to that field's
 * default weight before normalizing.
 */
function normalizeWeights(input) {
  const raw = {
    temperature: positiveOr(input?.temperature, DEFAULT_WEIGHTS.temperature),
    precipitationChance: positiveOr(input?.precipitationChance, DEFAULT_WEIGHTS.precipitationChance),
    airQuality: positiveOr(input?.airQuality, DEFAULT_WEIGHTS.airQuality),
    wind: positiveOr(input?.wind, DEFAULT_WEIGHTS.wind),
  };
  const sum = raw.temperature + raw.precipitationChance + raw.airQuality + raw.wind;
  if (!(sum > 0)) return DEFAULT_WEIGHTS;
  return {
    temperature: raw.temperature / sum,
    precipitationChance: raw.precipitationChance / sum,
    airQuality: raw.airQuality / sum,
    wind: raw.wind / sum,
  };
}

function positiveOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function scoreTemperature(c) {
  // Comfort peaks around 18-24C, degrading linearly outward.
  const ideal = 21;
  const distance = Math.abs(c - ideal);
  return clamp(100 - distance * 4, 0, 100);
}

function scorePrecipitationChance(pct) {
  return clamp(100 - pct, 0, 100);
}

function scoreAqi(aqi) {
  if (aqi == null) return 70; // unknown -> mildly optimistic default, not a hard fail
  return clamp(100 - aqi / 2, 0, 100);
}

function scoreWind(kph) {
  if (kph <= 15) return 100;
  if (kph >= 50) return 0;
  return clamp(100 - ((kph - 15) / 35) * 100, 0, 100);
}

function labelFor(score) {
  if (score >= 80) return 'Great conditions';
  if (score >= 60) return 'Good conditions';
  if (score >= 40) return 'Fair conditions';
  if (score >= 20) return 'Poor conditions';
  return 'Stay indoors';
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
