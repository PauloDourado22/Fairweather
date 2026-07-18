import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { conditionsRouter } from './routes/conditions.js';

const app = express();

// CORS is locked to a single configured origin rather than `cors()` with no
// options (which defaults to reflecting every origin). For an API that will
// eventually sit behind a real domain, this is the difference between "only
// my frontend can call this" and "any website can call this on a visitor's
// behalf" — worth getting right even in a portfolio project.
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/conditions', conditionsRouter);

// Centralized error handler — catches anything a route forgot to catch
// itself, so the API always returns JSON instead of an Express HTML stack
// trace (which would leak internals to a caller in production).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Outdoor Conditions API listening on http://localhost:${config.port}`);
});
