// Vercel entry point: Vercel detects Hono and serves this default export as a Function.
import { createApp } from './app.js';
import { createStores } from './stores/index.js';

const app = createApp({ stores: createStores(), corsOrigins: process.env.CORS_ORIGINS });

export default app;
