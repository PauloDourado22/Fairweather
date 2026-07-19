// Mirrors DEFAULT_WEIGHTS in backend/src/services/activityScore.js, scaled
// to plain integers (35/30/25/10) instead of fractions (0.35/0.30/0.25/0.10)
// because that's what a <input type="range"> wants to work with. The
// backend normalizes whatever it receives, so sending these raw ints
// straight through is correct without any conversion on this end.
export const DEFAULT_WEIGHTS = {
  temperature: 35,
  precipitationChance: 30,
  airQuality: 25,
  wind: 10,
};

export const WEIGHT_FIELDS = [
  { key: 'temperature', label: 'Temperature' },
  { key: 'precipitationChance', label: 'Rain chance' },
  { key: 'airQuality', label: 'Air quality' },
  { key: 'wind', label: 'Wind' },
];
