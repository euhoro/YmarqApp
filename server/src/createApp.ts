import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import { requireAuth } from './auth/requireAuth.js';
import type { TokenVerifier } from './auth/verifier.js';
import { legacyRoutes } from './routes/legacy.js';
import { productRoutes } from './routes/products.js';
import { meRoutes, userRoutes } from './routes/profile.js';
import type { Stores } from './stores/index.js';

import type { AppEnv } from './env.js';

export type { AppEnv } from './env.js';

export interface AppDeps {
  stores: Stores;
  /** Verifies sign-in tokens on protected routes (Firebase, or dev tokens in tests). */
  verifyToken: TokenVerifier;
  corsOrigins?: string;
}

/** Builds the API. Tests pass in-memory stores; `index.ts` wires the real ones. */
export function createApp({ stores, verifyToken, corsOrigins = '*' }: AppDeps) {
  const app = new Hono<AppEnv>();

  app.use(logger());
  app.use(
    cors({
      origin: corsOrigins === '*' ? '*' : corsOrigins.split(',').map((origin) => origin.trim()),
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(async (c, next) => {
    c.set('stores', stores);
    await next();
  });

  app.get('/health', (c) => c.json({ ok: true }));

  // Everything under /v1 (and the legacy /photos route) needs a signed-in user.
  app.use('/v1/*', requireAuth(verifyToken));
  app.use('/photos/*', requireAuth(verifyToken));
  app.get('/v1/whoami', (c) => c.json(c.get('user')));
  app.route('/v1/products', productRoutes);
  app.route('/v1/me', meRoutes);
  app.route('/v1/users', userRoutes);
  app.route('/photos', legacyRoutes);

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    console.error(error);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
