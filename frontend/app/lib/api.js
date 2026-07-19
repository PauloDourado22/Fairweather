const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

/**
 * Single fetch wrapper for talking to the backend. Centralizing this means
 * there's exactly one place that knows the API's base URL and error shape —
 * components never construct fetch calls themselves.
 *
 * `weights` is optional and, when present, is sent as-is (raw slider values,
 * not pre-normalized) — the backend normalizes on its side, so this stays a
 * thin pass-through instead of duplicating that math on the client.
 */
export async function fetchConditions(city, weights) {
  const params = new URLSearchParams({ city });
  if (weights) {
    params.set('wTemp', weights.temperature);
    params.set('wPrecip', weights.precipitationChance);
    params.set('wAqi', weights.airQuality);
    params.set('wWind', weights.wind);
  }
  const res = await fetch(`${API_BASE_URL}/api/conditions?${params.toString()}`, {
    cache: 'no-store', // conditions are time-sensitive; never serve a stale build-time snapshot
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed with status ${res.status}`);
  }
  return data;
}

/**
 * Backs the "Add a city" autocomplete dropdown. Deliberately swallows
 * network/upstream errors into an empty result list rather than throwing —
 * a failed suggestion lookup should never block the user from just typing
 * a full name and submitting normally, it should just mean no dropdown.
 */
export async function searchCities(query) {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${API_BASE_URL}/api/cities/search?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}
