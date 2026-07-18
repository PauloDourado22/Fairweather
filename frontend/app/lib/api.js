const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

/**
 * Single fetch wrapper for talking to the backend. Centralizing this means
 * there's exactly one place that knows the API's base URL and error shape —
 * components never construct fetch calls themselves.
 */
export async function fetchConditions(city) {
  const res = await fetch(
    `${API_BASE_URL}/api/conditions?city=${encodeURIComponent(city)}`,
    { cache: 'no-store' } // conditions are time-sensitive; never serve a stale build-time snapshot
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed with status ${res.status}`);
  }
  return data;
}
