import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import type { Stores } from './stores/index.js';

export interface AppDeps {
  stores: Stores;
  corsOrigins?: string;
}

/** Builds the API. Tests pass in-memory stores; `index.ts` wires the real ones. */
export function createApp({ stores, corsOrigins = '*' }: AppDeps) {
  const app = new Hono<{ Variables: { stores: Stores } }>();

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

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    console.error(error);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
