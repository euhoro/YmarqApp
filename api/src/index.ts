// Vercel entry point: Vercel detects Hono and serves this default export as a Function.
// Keep it the only file named app/index/server.ts, since Vercel picks the first of those it finds.
import { createApp } from './createApp.js';
import { createStores } from './stores/index.js';

const app = createApp({ stores: createStores(), corsOrigins: process.env.CORS_ORIGINS });

export default app;
