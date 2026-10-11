import { beforeEach, describe, expect, it } from 'vitest';

import type { NewProduct } from '../../domain/product.js';
import type { ProductStore } from '../ProductStore.js';

const listing = (overrides: Partial<NewProduct> = {}): NewProduct => ({
  publisherId: 'user-a',
  description: 'Suzuki Swift 2012',
  hashtag: '#car',
  imageUrl: null,
  price: 25000,
  currency: 'ILS',
  category: 'Vehicles',
  location: 'Tel Aviv',
  ...overrides,
});

/** Behaviour every ProductStore must have. Call it from each implementation's test file. */
export function productStoreContract(name: string, createStore: () => Promise<ProductStore>) {
  describe(`${name} (ProductStore contract)`, () => {
    let store: ProductStore;
    beforeEach(async () => {
      store = await createStore();
    });

    it('creates listings with an id and returns them by id', async () => {
      const created = await store.create(listing());

      expect(created.id).toEqual(expect.any(String));
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(await store.get(created.id)).toEqual(created);
      expect(await store.get('00000000-0000-0000-0000-000000000000')).toBeNull();
    });

    it('lists newest first', async () => {
      const first = await store.create(listing({ description: 'First' }));
      await new Promise((resolve) => setTimeout(resolve, 5));
      const second = await store.create(listing({ description: 'Second' }));

      expect((await store.list()).map((p) => p.id)).toEqual([second.id, first.id]);
    });

    it('searches case-insensitively by substring across the text fields', async () => {
      const car = await store.create(listing());
      const sofa = await store.create(
        listing({ description: 'Sofa', hashtag: '', category: 'Furniture', location: 'Haifa' }),
      );

      expect((await store.search('SWIFT')).map((p) => p.id)).toEqual([car.id]);
      expect((await store.search('haif')).map((p) => p.id)).toEqual([sofa.id]);
      expect((await store.search('furniture')).map((p) => p.id)).toEqual([sofa.id]);
      expect((await store.search('#car')).map((p) => p.id)).toEqual([car.id]);
      expect(await store.search('nothing-matches')).toEqual([]);
      expect(await store.search('  ')).toHaveLength(2);
    });

    it('treats search text literally (no wildcards or injection)', async () => {
      await store.create(listing({ description: '100% cotton shirt' }));
      await store.create(listing({ description: 'Plain shirt' }));

      expect(await store.search('100%')).toHaveLength(1);
      expect(await store.search("'; drop table products; --")).toEqual([]);
    });

    it('deletes listings', async () => {
      const created = await store.create(listing());

      expect(await store.delete(created.id)).toBe(true);
      expect(await store.get(created.id)).toBeNull();
      expect(await store.delete(created.id)).toBe(false);
    });
  });
}
