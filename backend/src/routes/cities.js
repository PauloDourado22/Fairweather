import { Router } from 'express';
import { searchCities } from '../services/geocode.js';

export const citiesRouter = Router();

/**
 * GET /api/cities/search?q=Lon
 *
 * Backs the autocomplete dropdown in the "Add a city" input. Kept as its
 * own thin route (not folded into /api/conditions) because it returns
 * candidate locations, not weather — different shape, fired on every
 * keystroke rather than once on submit, and callers that only need this
 * shouldn't have to pay for the three-provider fan-out in that route.
 *
 * Queries under 2 characters return an empty result set without touching
 * the upstream provider at all — short queries return too many irrelevant
 * matches to be useful anyway, so there's no reason to spend the request.
 */
citiesRouter.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json({ results: [] });
  }
  try {
    const results = await searchCities(q.trim());
    res.json({ results });
  } catch (err) {
    const status = err.status ?? 502;
    res.status(status).json({ error: err.message });
  }
});
