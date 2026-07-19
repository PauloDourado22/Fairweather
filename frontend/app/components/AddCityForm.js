'use client';

import { useEffect, useRef, useState } from 'react';
import { searchCities } from '../lib/api';
import { normalizeCityName } from '../lib/normalizeName';

const SEARCH_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;
const NOTICE_DURATION_MS = 2500;
// Open-Meteo's geocoder returns exact coordinates for a given place, so two
// results for the "same" city land within a hair of each other — this just
// absorbs floating-point noise, not real distance.
const SAME_LOCATION_EPSILON = 0.01;

export function AddCityForm({ onAdd, isLoading, existingCities = [] }) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [notice, setNotice] = useState(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const noticeTimeoutRef = useRef(null);
  // Bumped on every new search; a response only gets applied if it's still
  // the most recent one requested. Without this, a slow response for "Lon"
  // could land after a fast response for "London" and clobber it.
  const requestIdRef = useRef(0);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      searchCities(query).then((results) => {
        if (requestId !== requestIdRef.current) return; // stale response, drop it
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlighted(-1);
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => () => clearTimeout(noticeTimeoutRef.current), []);

  function showNotice(message) {
    clearTimeout(noticeTimeoutRef.current);
    setNotice(message);
    noticeTimeoutRef.current = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
  }

  // Name match catches the common case instantly. The lat/lon check on top
  // catches the case a name comparison can't: two different spellings (an
  // alias, a translated name) that resolve to the same physical place —
  // only possible here because suggestions carry coordinates and
  // already-loaded cities do too, once they've finished fetching.
  function isDuplicate({ name, latitude, longitude }) {
    const nameMatch = existingCities.some(
      (c) => normalizeCityName(c.name) === normalizeCityName(name)
    );
    if (nameMatch) return true;
    if (latitude == null || longitude == null) return false;
    return existingCities.some(
      (c) =>
        c.latitude != null &&
        c.longitude != null &&
        Math.abs(c.latitude - latitude) < SAME_LOCATION_EPSILON &&
        Math.abs(c.longitude - longitude) < SAME_LOCATION_EPSILON
    );
  }

  function commit(candidate) {
    if (isDuplicate(candidate)) {
      setIsOpen(false);
      showNotice(`${candidate.name} is already on your board.`);
      return;
    }
    const added = onAdd(candidate.name);
    if (added === false) {
      // Defensive fallback: page.js's own name check disagreed with ours,
      // which shouldn't happen since both normalize the same way — still
      // surface something rather than fail silently.
      setIsOpen(false);
      showNotice(`${candidate.name} is already on your board.`);
      return;
    }
    setValue('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlighted(-1);
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Enter with a suggestion highlighted commits that suggestion; otherwise
    // it falls back to whatever the user actually typed, same as before
    // this feature existed.
    if (highlighted >= 0 && suggestions[highlighted]) {
      const s = suggestions[highlighted];
      commit({ name: s.name, latitude: s.latitude, longitude: s.longitude });
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    commit({ name: trimmed });
  }

  function handleKeyDown(e) {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlighted(-1);
    }
  }

  return (
    <div className="add-city-wrap" ref={containerRef}>
      <form className="add-city-form" onSubmit={handleSubmit} autoComplete="off">
        <div className="add-city-input-wrap">
          <input
            type="text"
            placeholder="Add a city"
            aria-label="City name"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setNotice(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            disabled={isLoading}
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="city-suggestions"
          />
          {isOpen && (
            <ul className="city-suggestions" id="city-suggestions" role="listbox">
              {suggestions.map((s, i) => {
                const dup = isDuplicate({ name: s.name, latitude: s.latitude, longitude: s.longitude });
                return (
                  <li key={`${s.name}|${s.latitude}|${s.longitude}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === highlighted}
                      aria-disabled={dup}
                      disabled={dup}
                      className={[
                        'city-suggestion',
                        i === highlighted ? 'is-active' : '',
                        dup ? 'is-duplicate' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onMouseDown={(e) => e.preventDefault()} // fires before blur, keeps focus in the input
                      onClick={() => commit({ name: s.name, latitude: s.latitude, longitude: s.longitude })}
                      onMouseEnter={() => setHighlighted(i)}
                    >
                      <span className="city-suggestion-name">{s.name}</span>
                      <span className="city-suggestion-meta">
                        {dup ? 'Added' : [s.admin1, s.country].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {notice && !isOpen && <p className="add-city-notice">{notice}</p>}
        </div>
        <button type="submit" className="add-city-submit" disabled={isLoading || !value.trim()} aria-label="Add city">
          {isLoading ? '···' : '+'}
        </button>
      </form>
    </div>
  );
}
