'use client';

import { useEffect, useState } from 'react';
import { fetchConditions } from './lib/api';
import { CityCard } from './components/CityCard';
import { AddCityForm } from './components/AddCityForm';

const STORAGE_KEY = 'outdoor-dashboard:cities';
const DEFAULT_CITIES = ['Leiria', 'Lisbon', 'Coimbra'];

export default function Home() {
  const [cityNames, setCityNames] = useState([]);
  const [results, setResults] = useState({}); // name -> { data, error, loading }
  const [isAdding, setIsAdding] = useState(false);

  // Load saved cities on mount. Falls back to a sensible Portugal-based
  // default list on first visit so the dashboard isn't empty for a new user.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setCityNames(saved ? JSON.parse(saved) : DEFAULT_CITIES);
  }, []);

  useEffect(() => {
    if (cityNames.length === 0) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cityNames));
    cityNames.forEach((name) => {
      if (!results[name]) loadCity(name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityNames]);

  async function loadCity(name) {
    setResults((prev) => ({ ...prev, [name]: { loading: true } }));
    try {
      const data = await fetchConditions(name);
      setResults((prev) => ({ ...prev, [name]: { data } }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [name]: { error: err.message } }));
    }
  }

  async function handleAdd(name) {
    if (cityNames.some((c) => c.toLowerCase() === name.toLowerCase())) return;
    setIsAdding(true);
    setCityNames((prev) => [...prev, name]);
    setIsAdding(false);
  }

  function handleRemove(name) {
    setCityNames((prev) => prev.filter((c) => c !== name));
    setResults((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  return (
    <main className="container">
      <div className="header">
        <div className="header-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Live data
          </span>
          <h1>Outdoor Conditions Dashboard</h1>
          <p>Weather, air quality, and daylight — merged into one activity score per city.</p>
        </div>
        <AddCityForm onAdd={handleAdd} isLoading={isAdding} />
      </div>

      {cityNames.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧭</div>
          <p className="empty-state-title">No cities yet</p>
          <p>Add a city above to see its live conditions and activity score.</p>
        </div>
      ) : (
        <div className="grid">
          {cityNames.map((name) => {
            const entry = results[name];
            if (!entry || entry.loading) {
              return <CardSkeleton key={name} name={name} />;
            }
            if (entry.error) {
              return (
                <div className="card" key={name}>
                  <p className="city-name">{name}</p>
                  <p className="error-text">{entry.error}</p>
                </div>
              );
            }
            return <CityCard key={name} data={entry.data} onRemove={() => handleRemove(name)} />;
          })}
        </div>
      )}

      <footer className="footer">Weather &amp; air quality data refresh automatically every few minutes.</footer>
    </main>
  );
}

// Mirrors the real card's structure so the grid doesn't jump when data
// arrives — a shimmering placeholder reads as "working on it" instead of
// the plain "Loading…" text a v1 dashboard would ship with.
function CardSkeleton({ name }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="city-name">{name}</p>
          <div className="skeleton skeleton-sub" />
        </div>
      </div>
      <div className="skeleton skeleton-temp" />
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-block" />
    </div>
  );
}
