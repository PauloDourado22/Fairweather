import { config } from '../config.js';

// A minimal in-memory TTL cache. For a single-instance deployment (Render/Vercel
// hobby tier) this is the right amount of complexity — no Redis to provision or
// pay for. The trade-off, worth knowing: this cache is per-process, so if you
// ever scale to multiple instances behind a load balancer, each instance has
// its own cache and you'd want to move this to Redis. Flagging that here so
// it's a conscious choice later, not a surprise.
const store = new Map();

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs = config.cacheTtlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Wraps an async fetcher so callers don't have to repeat the
// "check cache, else fetch, else store" dance everywhere.
export async function cached(key, fetcher, ttlMs) {
  const hit = getCached(key);
  if (hit) return hit;
  const value = await fetcher();
  setCached(key, value, ttlMs);
  return value;
}
