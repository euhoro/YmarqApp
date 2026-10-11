// Vercel entry point: Vercel detects Hono and serves this default export as a Function.
// It must import `hono` itself, and stay the only file named app/index/server.ts (Vercel picks the
// first of those it finds).
import { Hono } from 'hono';

import { createTokenVerifier } from './auth/config.js';
import { createApp, type AppEnv } from './createApp.js';
import { createStores } from './stores/index.js';

const app: Hono<AppEnv> = createApp({
  stores: createStores(),
  verifyToken: createTokenVerifier(),
  corsOrigins: process.env.CORS_ORIGINS,
});

export default app;
