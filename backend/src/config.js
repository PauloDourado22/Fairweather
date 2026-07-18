import 'dotenv/config';

// Centralizing config here means every other file imports config, not process.env
// directly — one place to see every environment variable the app depends on,
// and one place to add validation later if a required var is missing.
export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  cacheTtlMs: Number(process.env.CACHE_TTL_MS) || 10 * 60 * 1000,
};
