import { beforeEach, describe, expect, it } from 'vitest';

import type { ListingText, SavedSearchStore } from '../SavedSearchStore.js';

const UNKNOWN = '00000000-0000-0000-0000-000000000000';
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

const listing = (overrides: Partial<ListingText> = {}): ListingText => ({
  publisherId: 'dana',
  description: 'Suzuki Swift 2012',
  hashtag: '#car',
  category: 'Vehicles',
  location: 'Tel Aviv',
  ...overrides,
});

/** Behaviour every SavedSearchStore must have. Call it from each implementation's test file. */
export function savedSearchStoreContract(
  name: string,
  createStore: () => Promise<SavedSearchStore>,
) {
  describe(`${name} (SavedSearchStore contract)`, () => {
    let store: SavedSearchStore;

    beforeEach(async () => {
      store = await createStore();
    });

    it('saves a search and lists the user’s searches newest first', async () => {
      const { savedSearch: older, created } = await store.save('avi', 'swift');
      expect(created).toBe(true);
      expect(older).toEqual({
        id: expect.any(String),
        userId: 'avi',
        query: 'swift',
        createdAt: expect.any(Date),
      });
      await tick();
      const { savedSearch: newer } = await store.save('avi', 'sofa');
      await store.save('eve', 'bike');

      expect(await store.list('avi')).toEqual([newer, older]);
      expect(await store.list('nobody')).toEqual([]);
    });

    it('returns the existing search for the same query ignoring case, per user', async () => {
      const { savedSearch } = await store.save('avi', 'Swift');

      expect(await store.save('avi', 'sWIFT')).toEqual({ savedSearch, created: false });
      expect(await store.list('avi')).toEqual([savedSearch]);

      const other = await store.save('eve', 'swift');
      expect(other.created).toBe(true);
      expect(other.savedSearch.id).not.toBe(savedSearch.id);
    });

    it('deletes only the user’s own searches', async () => {
      const { savedSearch } = await store.save('avi', 'swift');

      expect(await store.delete('eve', savedSearch.id)).toBe(false);
      expect(await store.delete('avi', UNKNOWN)).toBe(false);
      expect(await store.delete('avi', 'not-a-uuid')).toBe(false);
      expect(await store.list('avi')).toEqual([savedSearch]);

      expect(await store.delete('avi', savedSearch.id)).toBe(true);
      expect(await store.list('avi')).toEqual([]);
      expect(await store.delete('avi', savedSearch.id)).toBe(false);
    });

    it('finds other users’ searches matching any text field, case-insensitively', async () => {
      const { savedSearch: swift } = await store.save('avi', 'SWIFT');
      await tick();
      const { savedSearch: city } = await store.save('eve', 'tel aviv');
      await tick();
      const { savedSearch: car } = await store.save('eve', '#Car');
      await tick();
      const { savedSearch: vehicles } = await store.save('moshe', 'vehicle');
      await store.save('eve', 'sofa');
      await tick();
      // The publisher's own searches never match their listing.
      const { savedSearch: danas } = await store.save('dana', 'swift');

      expect(await store.findMatching(listing())).toEqual([swift, city, car, vehicles]);
      expect(await store.findMatching(listing({ publisherId: 'avi' }))).toEqual([
        city,
        car,
        vehicles,
        danas,
      ]);
    });

    it('matches only fields that are set, and treats queries literally', async () => {
      const { savedSearch: percent } = await store.save('avi', '100%');
      await store.save('avi', '_otton');
      await store.save('eve', 'haifa');

      const shirt = listing({
        description: '100% cotton shirt',
        hashtag: '',
        category: null,
        location: null,
      });
      expect(await store.findMatching(shirt)).toEqual([percent]);
      expect(await store.findMatching(listing({ description: 'Nothing here' }))).toEqual([]);
    });
  });
}
