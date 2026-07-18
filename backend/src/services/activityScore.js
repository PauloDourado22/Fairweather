/**
 * Derives a single 0-100 "good time to be outside" score from the three raw
 * feeds. This is the one piece of real business logic in the app — without
 * it, this is just three API passthroughs stitched together, which isn't
 * something a client would pay for. With it, the API is producing an
 * opinion, not just data.
 *
 * The weights below are a reasonable starting point, not a scientifically
 * derived model — worth saying out loud in an interview or to a client
 * rather than presenting it as more rigorous than it is.
 */
export function computeActivityScore({ weather, airQuality }) {
  const tempScore = scoreTemperature(weather.current.temperatureC);
  const precipScore = scorePrecipitationChance(
    weather.daily[0]?.precipitationChancePct ?? 0
  );
  const aqiScore = scoreAqi(airQuality.usAqi);
  const windScore = scoreWind(weather.current.windKph);

  const weighted =
    tempScore * 0.35 + precipScore * 0.3 + aqiScore * 0.25 + windScore * 0.1;

  return {
    score: Math.round(weighted),
    label: labelFor(weighted),
    breakdown: {
      temperature: tempScore,
      precipitationChance: precipScore,
      airQuality: aqiScore,
      wind: windScore,
    },
  };
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
