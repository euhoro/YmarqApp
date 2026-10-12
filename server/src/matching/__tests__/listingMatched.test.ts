import { describe, expect, it, vi } from 'vitest';

import { devVerifier } from '../../auth/verifier.js';
import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';
import { queryMatchesListing, type ListingMatchedHandler } from '../listingMatched.js';

function setup(onListingMatched?: ListingMatchedHandler) {
  const app = createApp({
    stores: createStores('memory'),
    verifyToken: devVerifier,
    onListingMatched,
  });
  const as = (user: string) => {
    const headers = { Authorization: `Bearer dev:${user}`, 'Content-Type': 'application/json' };
    return {
      get: (path: string) => app.request(path, { headers }),
      post: (path: string, body: unknown) =>
        app.request(path, { method: 'POST', headers, body: JSON.stringify(body) }),
      save: async (query: string) => {
        const body = JSON.stringify({ query });
        const response = await app.request('/v1/saved-searches', { method: 'POST', headers, body });
        return response.json();
      },
    };
  };
  return { dana: as('dana'), avi: as('avi'), eve: as('eve') };
}

describe('queryMatchesListing', () => {
  const listing = {
    publisherId: 'dana',
    description: 'Suzuki Swift 2012',
    hashtag: '#car',
    category: null,
    location: 'Haifa',
  };

  it('is a case-insensitive substring match over the searchable fields', () => {
    expect(queryMatchesListing('SWIFT', listing)).toBe(true);
    expect(queryMatchesListing('#Car', listing)).toBe(true);
    expect(queryMatchesListing('haif', listing)).toBe(true);
    expect(queryMatchesListing('sofa', listing)).toBe(false);
    expect(queryMatchesListing('  ', listing)).toBe(false);
  });
});

describe('listing.matched on POST /v1/products', () => {
  it('emits one event with the matching saved searches of other users', async () => {
    const onListingMatched = vi.fn();
    const { dana, avi, eve } = setup(onListingMatched);
    const aviSwift = await avi.save('SWIFT');
    const eveHaifa = await eve.save('haifa');
    await eve.save('sofa');
    await dana.save('swift'); // the seller's own search

    const created = await dana.post('/v1/products', {
      description: 'Suzuki Swift 2012',
      location: 'Haifa',
    });
    expect(created.status).toBe(201);
    const product = await created.json();

    expect(onListingMatched).toHaveBeenCalledTimes(1);
    const [event] = onListingMatched.mock.calls[0]!;
    expect(event).toEqual({
      type: 'listing.matched',
      product: { ...product, createdAt: new Date(product.createdAt) },
      matches: [
        { savedSearchId: aviSwift.id, userId: 'avi', query: 'SWIFT' },
        { savedSearchId: eveHaifa.id, userId: 'eve', query: 'haifa' },
      ],
    });
  });

  it('emits nothing when no other user’s search matches', async () => {
    const onListingMatched = vi.fn();
    const { dana, eve } = setup(onListingMatched);
    await eve.save('sofa');
    await dana.save('swift');

    expect((await dana.post('/v1/products', { description: 'Suzuki Swift' })).status).toBe(201);
    expect(onListingMatched).not.toHaveBeenCalled();
  });

  it('still creates the listing when the listener fails', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { dana, avi } = setup(async () => {
      throw new Error('push is down');
    });
    await avi.save('swift');

    expect((await dana.post('/v1/products', { description: 'Suzuki Swift' })).status).toBe(201);
    expect(await (await dana.get('/v1/products')).json()).toHaveLength(1);
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });
});
