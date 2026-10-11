import { describe, expect, it } from 'vitest';

import { devVerifier } from '../../auth/verifier.js';
import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';

const SUZUKI = {
  description: 'Selling my Suzuki Swift 2012',
  hashtag: '#car',
  imageUrl: 'https://example.com/swift.jpg',
  price: 25000,
  currency: 'ILS',
  category: 'Vehicles',
  location: 'Tel Aviv',
};

function setup() {
  const app = createApp({ stores: createStores('memory'), verifyToken: devVerifier });
  const as = (user: string) => ({
    get: (path: string) => app.request(path, { headers: { Authorization: `Bearer dev:${user}` } }),
    post: (path: string, body: unknown) =>
      app.request(path, {
        method: 'POST',
        headers: { Authorization: `Bearer dev:${user}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    delete: (path: string) =>
      app.request(path, { method: 'DELETE', headers: { Authorization: `Bearer dev:${user}` } }),
  });
  return { app, dana: as('dana'), avi: as('avi') };
}

describe('/v1/products', () => {
  it('requires sign-in', async () => {
    const { app } = setup();
    expect((await app.request('/v1/products')).status).toBe(401);
    expect((await app.request('/photos/GetProducts/1')).status).toBe(401);
  });

  it('creates a listing with the caller as publisher and returns it', async () => {
    const { dana } = setup();

    const response = await dana.post('/v1/products', SUZUKI);

    expect(response.status).toBe(201);
    const created = await response.json();
    expect(created).toMatchObject({ ...SUZUKI, publisherId: 'dana', id: expect.any(String) });
    expect(new Date(created.createdAt).toString()).not.toBe('Invalid Date');
    expect(await (await dana.get(`/v1/products/${created.id}`)).json()).toEqual(created);
  });

  it('ignores a publisherId sent by the client', async () => {
    const { dana } = setup();
    const created = await (
      await dana.post('/v1/products', { ...SUZUKI, publisherId: 'avi' })
    ).json();

    expect(created.publisherId).toBe('dana');
  });

  it('validates input', async () => {
    const { dana } = setup();

    const tooShort = await dana.post('/v1/products', { description: 'x' });
    expect(tooShort.status).toBe(400);
    expect((await tooShort.json()).error).toBe('Invalid listing');

    expect((await dana.post('/v1/products', { ...SUZUKI, price: -5 })).status).toBe(400);
    expect((await dana.post('/v1/products', { ...SUZUKI, currency: 'BTC' })).status).toBe(400);
    expect((await dana.post('/v1/products', 'not json')).status).toBe(400);
  });

  it("lists everyone's listings newest first and searches with ?q=", async () => {
    const { dana, avi } = setup();
    await dana.post('/v1/products', SUZUKI);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await avi.post('/v1/products', { description: 'Sofa, almost new', location: 'Haifa' });

    const all = await (await dana.get('/v1/products')).json();
    expect(all.map((p: { description: string }) => p.description)).toEqual([
      'Sofa, almost new',
      SUZUKI.description,
    ]);

    const found = await (await dana.get('/v1/products?q=HAIFA')).json();
    expect(found).toHaveLength(1);
    expect(found[0].publisherId).toBe('avi');
  });

  it('returns 404 for unknown listings', async () => {
    const { dana } = setup();
    const response = await dana.get('/v1/products/00000000-0000-0000-0000-000000000000');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Listing not found' });
  });

  it('only lets the seller delete a listing', async () => {
    const { dana, avi } = setup();
    const created = await (await dana.post('/v1/products', SUZUKI)).json();

    const forbidden = await avi.delete(`/v1/products/${created.id}`);
    expect(forbidden.status).toBe(403);

    expect((await dana.delete(`/v1/products/${created.id}`)).status).toBe(204);
    expect((await dana.get(`/v1/products/${created.id}`)).status).toBe(404);
    expect((await dana.delete(`/v1/products/${created.id}`)).status).toBe(404);
  });
});

describe('legacy GET /photos/GetProducts/{userCode}', () => {
  it('returns products in the 2014 PascalCase format', async () => {
    const { dana } = setup();
    const created = await (await dana.post('/v1/products', SUZUKI)).json();

    const legacy = await (await dana.get('/photos/GetProducts/1111111111')).json();

    expect(legacy).toEqual([
      {
        Id: created.id,
        Description: SUZUKI.description,
        Hashtag: '#car',
        Image: SUZUKI.imageUrl,
        PublisherId: 'dana',
        Price: 25000,
        Currency: 'ILS',
        Category: 'Vehicles',
        Location: 'Tel Aviv',
      },
    ]);
  });
});
