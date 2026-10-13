// Vercel entry point: Vercel detects Hono and serves this default export as a Function.
// It must import `hono` itself, and stay the only file named app/index/server.ts (Vercel picks the
// first of those it finds).
import { Expo } from 'expo-server-sdk';
import { Hono } from 'hono';

import { createTokenVerifier } from './auth/config.js';
import { createApp, type AppEnv } from './createApp.js';
import { createPushNotifier } from './push/pushNotifier.js';
import { createStores } from './stores/index.js';

const stores = createStores();
// EXPO_ACCESS_TOKEN is only needed if "enhanced push security" is turned on in Expo.
const push = createPushNotifier({
  devices: stores.devices,
  profiles: stores.profiles,
  expo: new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN }),
});

const app: Hono<AppEnv> = createApp({
  stores,
  verifyToken: createTokenVerifier(),
  corsOrigins: process.env.CORS_ORIGINS,
  onMessageCreated: push.onMessageCreated,
  onListingMatched: push.onListingMatched,
});

export default app;
