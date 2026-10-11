import { describe, expect, it } from 'vitest';

import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';

const app = createApp({ stores: createStores('memory') });

describe('API basics', () => {
  it('GET /health returns ok', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('unknown routes return a JSON 404', async () => {
    const response = await app.request('/nope');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Not found' });
  });

  it('answers CORS preflight for the web app', async () => {
    const response = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://ymarq-app.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
});

describe('createStores', () => {
  it('needs DATABASE_URL for postgres and rejects unknown stores', () => {
    expect(() => createStores('postgres', '')).toThrow(/DATABASE_URL/);
    expect(() => createStores('dynamo')).toThrow(/Unknown STORE/);
  });

  it('builds a Postgres store from a URL (no connection until the first query)', () => {
    const stores = createStores('postgres', 'postgresql://user:pass@example.neon.tech/db');
    expect(stores.products.constructor.name).toBe('PostgresProductStore');
  });
});

describe('Vercel entry point (src/index.ts)', () => {
  it('serves the same API', async () => {
    const { default: entry } = await import('../../index.js');
    const response = await entry.request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await (await entry.request('/nope')).json()).toEqual({ error: 'Not found' });
  });
});
