// Mirrors the thresholds in backend/src/services/activityScore.js's
// labelFor() (80/60/40/20) so a score of e.g. 82 gets the same tier
// whether you're reading the API label or the panel color here. The
// copy is deliberately different (poster voice vs. API voice) — this
// is a display concern, not a re-derivation of the score itself.
const TIERS = [
  { min: 80, label: 'Great day', bg: '#cfe8cf', ink: '#173f2a' },
  { min: 60, label: 'Good day', bg: '#dcebc8', ink: '#2b4a1e' },
  { min: 40, label: 'Fair day', bg: '#f4e3b8', ink: '#5c4310' },
  { min: 20, label: 'Poor day', bg: '#f0cfba', ink: '#6b3014' },
  { min: 0, label: 'Stay indoors', bg: '#e8b9ab', ink: '#5c2414' },
];

const FALLBACK_TIER = { label: 'Unknown', bg: '#e9e5da', ink: '#4c4636' };

export function scoreTier(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return FALLBACK_TIER;
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}
