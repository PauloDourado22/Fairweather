import fetch from 'node-fetch';

const DEFAULT_RETRIES = 2; // 3 attempts total
const BASE_DELAY_MS = 300;

/**
 * A thin wrapper around fetch that retries on 429 (Too Many Requests) with
 * exponential backoff + jitter, capped at `retries` attempts.
 *
 * Every upstream this app calls (weather, air quality, geocoding) is a free,
 * anonymous Open-Meteo endpoint rate-limited per IP address, not per app.
 * Render's free tier shares outbound IPs across many unrelated apps, so a
 * 429 here is more likely caused by a neighbor's traffic tipping the shared
 * IP over the limit than by this app's own (cached, low-volume) requests.
 * Retrying smooths over that kind of transient burst — it can't do anything
 * about the IP being *persistently* saturated, which is a real risk this
 * doesn't eliminate, only reduces.
 *
 * Only retries on 429. Any other status (4xx/5xx) or thrown error is not a
 * rate-limit signal, so retrying it would just add latency for no benefit —
 * it's returned/thrown immediately instead.
 */
export async function fetchWithRetry(url, { retries = DEFAULT_RETRIES } = {}) {
  let lastRes;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);
    if (res.status !== 429) return res;
    lastRes = res;
    if (attempt === retries) break;
    // Exponential backoff with jitter (attempt 0: ~300-450ms, attempt 1: ~600-900ms, ...)
    // — jitter keeps concurrent requests for different cities from all retrying
    // in lockstep and re-tripping the same limit together.
    const delay = BASE_DELAY_MS * 2 ** attempt * (1 + Math.random() * 0.5);
    await sleep(delay);
  }
  return lastRes;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
