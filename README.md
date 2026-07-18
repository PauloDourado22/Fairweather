# Outdoor Conditions Dashboard

A dashboard that aggregates weather, air quality, and daylight data from three
independent, keyless third-party APIs into one view — with a derived
"outdoor activity score" per city, not just raw numbers.

**Live pitch for a client:** "I can pull data from any APIs you already use
(inventory system, CRM, shipping provider) into one dashboard your team
actually looks at every morning."

## Why this project exists

This is the "dashboards and third-party API integrations" service package
from the freelance roadmap, rebuilt in React/Next.js + Node instead of Flask —
proof of that stack, not a duplicate of the existing football-dashboard project.

## Architecture

```
frontend (Next.js, App Router)  --->  backend (Express API)  --->  3 upstream providers
     localStorage (saved cities)         in-memory TTL cache         Open-Meteo (weather)
                                                                      Open-Meteo (air quality)
                                                                      sunrise-sunset.org (daylight)
```

The frontend never calls the upstream providers directly. It only knows about
the Express API. That indirection buys three things:

1. **Caching in one place.** Each provider is cached independently (weather
   10 min, air quality 10 min, geocoding 24h, daylight 12h) so the free
   upstream APIs never get hammered by every browser tab refreshing.
2. **Partial-failure resilience.** `Promise.allSettled` in
   `backend/src/routes/conditions.js` means if the air-quality provider is
   down, the dashboard still renders weather and daylight instead of a blank
   error page.
3. **Room to grow.** Adding a 4th provider (e.g. a paid pollen API) means
   adding one file in `backend/src/services/` — the frontend and route layer
   don't change.

## What's genuinely non-trivial here (the part worth pointing at in an interview)

- `backend/src/services/activityScore.js` turns three raw feeds into one
  opinionated 0-100 score — the kind of business logic a client is actually
  paying for, not just an API passthrough.
- The cache (`backend/src/utils/cache.js`) is intentionally simple
  (in-memory `Map` with TTL) with a comment explaining exactly when you'd
  outgrow it (multi-instance deployments) and what you'd swap in (Redis).
  Knowing the limits of your own simple solution is the point, not a gap.

## Running it locally

```bash
# backend
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:4000

# frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev         # http://localhost:3000
```

No API keys required — every upstream provider used here is free and keyless,
so it runs unattended without configuration drift.

## Deploying

- **Backend:** Render or Railway free tier (Node web service).
- **Frontend:** Vercel. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.

## What a v2 would add

- Persist saved cities server-side per user (auth) instead of `localStorage`,
  so the list follows a user across devices.
- Swap the in-memory cache for Redis if this ever needs more than one backend
  instance.
- Add a 4th data source (pollen count) to strengthen the "dashboards and
  integrations" pitch further.
