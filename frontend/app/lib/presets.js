import { DEFAULT_WEIGHTS } from './weights';

// Each preset is just a named point in the same weight space the sliders
// already control — clicking one is exactly equivalent to dragging all
// four sliders to specific values at once, going through the same
// onChange the sliders use. This is what turns "four adjustable sliders"
// into "the score understands what you're doing": the underlying
// mechanism doesn't change, only how fast you reach a sensible starting
// point for a given activity.
//
// Deliberately not including a "Photography" preset, even though it's an
// obvious activity to reach for here — the score only has four signals
// (temperature, rain chance, air quality, wind), none of which speak to
// cloud cover or golden hour. A preset that claimed to optimize for
// photography without actually modeling light would be a UI promise the
// scoring logic can't keep. "Sensitive lungs" fills that slot instead —
// a shape (almost all weight on air quality) the existing signals can
// honestly deliver on.
export const PRESETS = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'The default weighting — no single signal dominates.',
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'running',
    label: 'Running',
    description: 'Heat and air quality matter most — you’re breathing hard.',
    weights: { temperature: 40, precipitationChance: 20, airQuality: 30, wind: 10 },
  },
  {
    id: 'cycling',
    label: 'Cycling',
    description: 'Wind and rain matter most — headwind and wet roads change the ride.',
    weights: { temperature: 15, precipitationChance: 30, airQuality: 15, wind: 40 },
  },
  {
    id: 'picnic',
    label: 'Picnic',
    description: 'Rain is the dealbreaker, wind ruins the spread, air quality barely matters.',
    weights: { temperature: 25, precipitationChance: 40, airQuality: 10, wind: 25 },
  },
  {
    id: 'sensitive-lungs',
    label: 'Sensitive lungs',
    description: 'Air quality dominates — for asthma, allergies, or a bad-air day.',
    weights: { temperature: 15, precipitationChance: 15, airQuality: 60, wind: 10 },
  },
];
