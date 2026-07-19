'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchConditions } from './lib/api';
import { DEFAULT_WEIGHTS } from './lib/weights';
import { normalizeCityName } from './lib/normalizeName';
import { CityCard } from './components/CityCard';
import { AddCityForm } from './components/AddCityForm';
import { ScoreWeightsPanel } from './components/ScoreWeightsPanel';

const STORAGE_KEY = 'outdoor-dashboard:cities';
const WEIGHTS_STORAGE_KEY = 'outdoor-dashboard:weights';
const DEFAULT_CITIES = ['Leiria', 'Lisbon', 'Coimbra'];
const WEIGHTS_DEBOUNCE_MS = 500;

export default function Home() {
  const [cityNames, setCityNames] = useState([]);
  const [results, setResults] = useState({}); // name -> { data, error, loading }
  const [isAdding, setIsAdding] = useState(false);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [weightsLoaded, setWeightsLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  // Skips the reload-all-cities effect the one time it fires right after
  // mount (when weightsLoaded flips true) — that transition is "we just
  // read localStorage", not "the user moved a slider", and the initial
  // city load below already uses the resolved weights.
  const skipNextReload = useRef(true);

  // Load saved cities on mount. Falls back to a sensible Portugal-based
  // default list on first visit so the dashboard isn't empty for a new user.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setCityNames(saved ? JSON.parse(saved) : DEFAULT_CITIES);
  }, []);

  // Load saved score weights on mount, if the user tuned them in a
  // previous visit. Runs independently of the cities effect above; React
  // batches both mount effects' state updates before the city-loading
  // effect below actually fires, so the very first fetch already uses
  // whatever weights this resolves to.
  useEffect(() => {
    const saved = window.localStorage.getItem(WEIGHTS_STORAGE_KEY);
    if (saved) {
      try {
        setWeights(JSON.parse(saved));
      } catch {
        // corrupted localStorage value — fall back to defaults silently
      }
    }
    setWeightsLoaded(true);
  }, []);

  useEffect(() => {
    if (cityNames.length === 0) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cityNames));
    cityNames.forEach((name) => {
      if (!results[name]) loadCity(name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityNames]);

  // Whenever the weights change (slider drag or reset), persist them and
  // re-fetch every already-loaded city so its score reflects the new
  // weighting. Debounced so dragging a slider doesn't fire a request per
  // pixel — only once the user stops moving it for half a second.
  useEffect(() => {
    if (!weightsLoaded) return;
    window.localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(weights));
    if (skipNextReload.current) {
      skipNextReload.current = false;
      return;
    }
    const timer = setTimeout(() => {
      cityNames.forEach((name) => loadCity(name));
    }, WEIGHTS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weights, weightsLoaded]);

  async function loadCity(name) {
    setResults((prev) => ({ ...prev, [name]: { loading: true } }));
    try {
      const data = await fetchConditions(name, weights);
      setResults((prev) => ({ ...prev, [name]: { data } }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [name]: { error: err.message } }));
    }
  }

  // The single source of truth for "is this city already tracked" — normalized
  // comparison (trim/case/diacritics) so "Sao Paulo" is recognized as a
  // duplicate of an already-added "São Paulo". Returns false instead of
  // throwing so AddCityForm can show an inline notice instead of the add
  // silently doing nothing, which was the actual bug being fixed here.
  function handleAdd(name) {
    const isDuplicate = cityNames.some(
      (c) => normalizeCityName(c) === normalizeCityName(name)
    );
    if (isDuplicate) return false;
    setIsAdding(true);
    setCityNames((prev) => [...prev, name]);
    setIsAdding(false);
    return true;
  }

  function handleRemove(name) {
    setCityNames((prev) => prev.filter((c) => c !== name));
    setResults((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  // Feeds AddCityForm's duplicate check. lat/lon is only present once a city
  // has finished loading — that's fine, name matching alone still catches
  // duplicates instantly, lat/lon just adds alias-name coverage on top once
  // it's available.
  const existingCities = cityNames.map((name) => ({
    name,
    latitude: results[name]?.data?.location?.latitude,
    longitude: results[name]?.data?.location?.longitude,
  }));

  // Drives the "Fairest today" ribbon — whichever loaded city currently has
  // the highest activity score, ties broken by list order.
  const bestCity = cityNames.reduce((best, name) => {
    const score = results[name]?.data?.activityScore?.score;
    if (score == null) return best;
    if (!best || score > best.score) return { name, score };
    return best;
  }, null)?.name;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="page">
      <header className="app-header">
        <div className="wordmark-row">
          <span className="wordmark">
            FAIRWEATHER<span className="wordmark-dot">.</span>
          </span>
          <span className="tagline">one score for being outside · {today}</span>
        </div>
        <div className="header-actions">
          <span className="live-indicator">
            <span className="live-dot" />
            Live
          </span>
          <button
            type="button"
            className="tune-btn"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
          >
            Tune score {panelOpen ? '▴' : '▾'}
          </button>
          <AddCityForm onAdd={handleAdd} isLoading={isAdding} existingCities={existingCities} />
        </div>
      </header>

      {panelOpen && <ScoreWeightsPanel weights={weights} onChange={setWeights} />}

      {cityNames.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No cities yet</p>
          <p>Add a city above to see its live conditions and activity score.</p>
        </div>
      ) : (
        <div className="panels">
          {cityNames.map((name) => {
            const entry = results[name];
            if (!entry || entry.loading) {
              return <PanelSkeleton key={name} name={name} />;
            }
            if (entry.error) {
              return (
                <div className="panel" key={name}>
                  <div className="panel-head">
                    <p className="panel-name">{name}</p>
                    <button
                      className="panel-remove"
                      onClick={() => handleRemove(name)}
                      aria-label={`Remove ${name}`}
                      style={{ opacity: 0.55 }}
                    >
                      ×
                    </button>
                  </div>
                  <p className="error-text">{entry.error}</p>
                </div>
              );
            }
            return (
              <CityCard
                key={name}
                data={entry.data}
                isBest={name === bestCity}
                onRemove={() => handleRemove(name)}
              />
            );
          })}
        </div>
      )}

      <footer className="app-footer">
        <span>Weather &amp; air by Open-Meteo · Daylight by sunrise-sunset.org</span>
        <span>Score blends temperature, wind, air quality &amp; daylight · refreshes every few minutes</span>
      </footer>
    </div>
  );
}

// Mirrors the real panel's structure so the row doesn't jump when data
// arrives — a shimmering placeholder reads as "working on it" instead of
// the plain "Loading…" text a v1 dashboard would ship with.
function PanelSkeleton({ name }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <p className="panel-name">{name}</p>
      </div>
      <div className="skeleton skeleton-cond" />
      <div className="skeleton skeleton-temp" />
      <div className="skeleton skeleton-stats" />
      <div className="skeleton skeleton-score" />
    </div>
  );
}
