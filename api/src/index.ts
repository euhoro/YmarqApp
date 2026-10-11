// Vercel entry point: Vercel detects Hono and serves this default export as a Function.
// It must import `hono` itself, and stay the only file named app/index/server.ts (Vercel picks the
// first of those it finds).
import { Hono } from 'hono';

import { createApp } from './createApp.js';
import { createStores } from './stores/index.js';

const app = new Hono().route(
  '/',
  createApp({ stores: createStores(), corsOrigins: process.env.CORS_ORIGINS }),
);

export default app;
