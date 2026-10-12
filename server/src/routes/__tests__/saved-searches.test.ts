import { describe, expect, it } from 'vitest';

import { devVerifier } from '../../auth/verifier.js';
import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';

const UNKNOWN = '00000000-0000-0000-0000-000000000000';
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

function setup() {
  const app = createApp({ stores: createStores('memory'), verifyToken: devVerifier });
  const as = (user: string) => {
    const headers = { Authorization: `Bearer dev:${user}`, 'Content-Type': 'application/json' };
    return {
      get: (path: string) => app.request(path, { headers }),
      post: (path: string, body: unknown) =>
        app.request(path, { method: 'POST', headers, body: JSON.stringify(body) }),
      delete: (path: string) => app.request(path, { method: 'DELETE', headers }),
    };
  };
  return { app, avi: as('avi'), eve: as('eve') };
}

describe('/v1/saved-searches', () => {
  it('requires sign-in', async () => {
    const { app } = setup();
    expect((await app.request('/v1/saved-searches')).status).toBe(401);
    expect((await app.request('/v1/saved-searches', { method: 'POST' })).status).toBe(401);
  });

  it('saves trimmed searches and lists only mine, newest first', async () => {
    const { avi, eve } = setup();

    const response = await avi.post('/v1/saved-searches', { query: '  Suzuki Swift  ' });
    expect(response.status).toBe(201);
    const swift = await response.json();
    expect(swift).toEqual({
      id: expect.any(String),
      userId: 'avi',
      query: 'Suzuki Swift',
      createdAt: expect.any(String),
    });
    expect(new Date(swift.createdAt).toISOString()).toBe(swift.createdAt);
    await tick();
    const sofa = await (await avi.post('/v1/saved-searches', { query: 'sofa' })).json();
    await eve.post('/v1/saved-searches', { query: 'bike' });

    expect(await (await avi.get('/v1/saved-searches')).json()).toEqual([sofa, swift]);
  });

  it('returns the existing search (200) for the same query ignoring case', async () => {
    const { avi } = setup();
    const first = await (await avi.post('/v1/saved-searches', { query: 'Swift' })).json();

    const again = await avi.post('/v1/saved-searches', { query: ' SWIFT ' });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual(first);
    expect(await (await avi.get('/v1/saved-searches')).json()).toEqual([first]);
  });

  it('validates the query (1-100 characters after trimming)', async () => {
    const { avi } = setup();
    expect((await avi.post('/v1/saved-searches', { query: '   ' })).status).toBe(400);
    expect((await avi.post('/v1/saved-searches', { query: 'x'.repeat(101) })).status).toBe(400);
    expect((await avi.post('/v1/saved-searches', {})).status).toBe(400);
    expect((await avi.post('/v1/saved-searches', 'not json')).status).toBe(400);
    expect((await avi.post('/v1/saved-searches', { query: 'x'.repeat(100) })).status).toBe(201);
  });

  it('deletes my searches (204), 404 for unknown ids and other users’ searches', async () => {
    const { avi, eve } = setup();
    const swift = await (await avi.post('/v1/saved-searches', { query: 'swift' })).json();

    expect((await eve.delete(`/v1/saved-searches/${swift.id}`)).status).toBe(404);
    expect((await avi.delete(`/v1/saved-searches/${UNKNOWN}`)).status).toBe(404);
    expect((await avi.delete('/v1/saved-searches/not-a-uuid')).status).toBe(404);
    expect(await (await avi.get('/v1/saved-searches')).json()).toEqual([swift]);

    expect((await avi.delete(`/v1/saved-searches/${swift.id}`)).status).toBe(204);
    expect(await (await avi.get('/v1/saved-searches')).json()).toEqual([]);
  });
});
