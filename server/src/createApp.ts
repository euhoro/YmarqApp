import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import { requireAuth, type AuthVariables } from './auth/requireAuth.js';
import type { TokenVerifier } from './auth/verifier.js';
import type { Stores } from './stores/index.js';

/** Hono environment of the API: request-scoped variables available via `c.get(...)`. */
export type AppEnv = { Variables: { stores: Stores } & Partial<AuthVariables> };

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

  // Everything under /v1 needs a signed-in user.
  app.use('/v1/*', requireAuth(verifyToken));
  app.get('/v1/whoami', (c) => c.json(c.get('user')));

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    console.error(error);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
