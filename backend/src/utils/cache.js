import { config } from '../config.js';

// A minimal in-memory TTL cache. For a single-instance deployment (Render/Vercel
// hobby tier) this is the right amount of complexity — no Redis to provision or
// pay for. The trade-off, worth knowing: this cache is per-process, so if you
// ever scale to multiple instances behind a load balancer, each instance has
// its own cache and you'd want to move this to Redis. Flagging that here so
// it's a conscious choice later, not a surprise.
const store = new Map();

// How long a value is still worth serving as a stale fallback after its
// normal TTL has expired, and how long an abandoned key (a city nobody's
// asked for since) sticks around in memory at all. Deliberately much longer
// than any real TTL here (12h at most, in daylight.js) — a stale reading
// from a few hours ago is still far more useful to show than "no score",
// and this cache is small enough (one entry per distinct city ever looked
// up) that holding entries this long is not a real memory concern for a
// single-instance hobby deployment.
const STALE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null; // expired for fresh-read purposes, kept for getStale
  return entry.value;
}

// Returns the last known value for `key` even if its TTL has expired, as
// long as it's not older than STALE_MAX_AGE_MS. Used as a fallback when a
// refetch fails (e.g. an upstream still rate-limiting us after retries) —
// serving a stale reading beats surfacing an error to the user.
export function getStale(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > STALE_MAX_AGE_MS) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs = config.cacheTtlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs, storedAt: Date.now() });
}

// Wraps an async fetcher so callers don't have to repeat the
// "check cache, else fetch, else store" dance everywhere. On a fetch
// failure, falls back to the last known value for this key (however stale,
// up to STALE_MAX_AGE_MS) rather than propagating the error — see getStale.
export async function cached(key, fetcher, ttlMs) {
  const hit = getCached(key);
  if (hit) return hit;
  try {
    const value = await fetcher();
    setCached(key, value, ttlMs);
    return value;
  } catch (err) {
    const stale = getStale(key);
    if (stale) {
      console.warn(`[cache] "${key}" refetch failed (${err.message}) — serving stale value.`);
      return stale;
    }
    throw err;
  }
}
