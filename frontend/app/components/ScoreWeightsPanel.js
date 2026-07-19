'use client';

import { WEIGHT_FIELDS } from '../lib/weights';
import { PRESETS } from '../lib/presets';

// Exposes the exact weighting backend/src/services/activityScore.js runs
// with. This is the actual point of the demo: the score isn't a fixed
// formula baked into the UI, it's a pattern — four signals in, one weighted
// opinion out — and swapping what feeds it (for a client's own signals)
// wouldn't touch anything else in the app.
export function ScoreWeightsPanel({ weights, onChange }) {
  const total = WEIGHT_FIELDS.reduce((sum, f) => sum + (weights[f.key] ?? 0), 0) || 1;
  const activePreset = PRESETS.find((p) => matchesPreset(weights, p));

  function handleSlider(key, value) {
    onChange({ ...weights, [key]: Number(value) });
  }

  return (
    <div className="weights-panel">
      <div className="weights-panel-intro">
        <p className="weights-panel-title">Tune the score</p>
        <p className="weights-panel-copy">
          This is the live weighting behind every panel below — pick an activity or drag a
          slider yourself, and the score recomputes from the same API calls, nothing is faked
          client-side.
        </p>
      </div>

      <div className="preset-row">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={preset.id === activePreset?.id ? 'preset-chip is-active' : 'preset-chip'}
            aria-pressed={preset.id === activePreset?.id}
            title={preset.description}
            onClick={() => onChange(preset.weights)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className="preset-desc">
        {activePreset ? activePreset.description : 'Custom weighting — no preset matches these sliders.'}
      </p>

      <div className="weights-grid">
        {WEIGHT_FIELDS.map((f) => {
          const value = weights[f.key] ?? 0;
          const pct = Math.round((value / total) * 100);
          return (
            <div className="weight-control" key={f.key}>
              <div className="weight-control-head">
                <span>{f.label}</span>
                <span className="weight-pct">{pct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={value}
                onChange={(e) => handleSlider(f.key, e.target.value)}
                aria-label={`${f.label} weight`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function matchesPreset(weights, preset) {
  return WEIGHT_FIELDS.every((f) => (weights[f.key] ?? 0) === preset.weights[f.key]);
}
