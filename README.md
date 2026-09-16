# Fairweather

A dashboard that turns three separate weather/air-quality APIs into one "good time to be outside" score per city, plus a suggested 2-hour window in the next 18 hours to actually go do something.

Pulls from Open-Meteo (forecast), Open-Meteo Air Quality, and sunrise-sunset.org — three independent upstreams, each with its own service file and its own failure boundary, so one provider going down doesn't take the whole dashboard with it. The score itself is a weighted blend of temperature, rain chance, air quality, and wind, and the weights are adjustable from the UI rather than hardcoded.

## Stack

- **Backend:** Express, plain fetch to third-party APIs, in-memory caching
- **Frontend:** Next.js

## Running locally

```bash
# backend
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:4000

# frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev         # http://localhost:3000
```
