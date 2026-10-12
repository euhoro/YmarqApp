import { beforeEach, describe, expect, it } from 'vitest';

import type { ProfileStore } from '../ProfileStore.js';

/** Behaviour every ProfileStore must have. Call it from each implementation's test file. */
export function profileStoreContract(name: string, createStore: () => Promise<ProfileStore>) {
  describe(`${name} (ProfileStore contract)`, () => {
    let store: ProfileStore;
    beforeEach(async () => {
      store = await createStore();
    });

    it('returns null for users without a profile', async () => {
      expect(await store.get('nobody')).toBeNull();
    });

    it('creates a profile and returns it by id', async () => {
      const saved = await store.save({
        id: 'firebase-uid-1',
        displayName: 'Dana',
        phoneNumber: '+972501234567',
      });

      expect(saved).toMatchObject({
        id: 'firebase-uid-1',
        displayName: 'Dana',
        phoneNumber: '+972501234567',
      });
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(await store.get('firebase-uid-1')).toEqual(saved);
    });

    it('updates an existing profile and keeps its creation time', async () => {
      const first = await store.save({ id: 'u1', displayName: 'Dana', phoneNumber: null });
      await new Promise((resolve) => setTimeout(resolve, 5));

      const second = await store.save({ id: 'u1', displayName: 'Dana K', phoneNumber: null });

      expect(second.displayName).toBe('Dana K');
      expect(second.createdAt).toEqual(first.createdAt);
      expect(second.updatedAt.getTime()).toBeGreaterThan(first.updatedAt.getTime());
      expect(await store.get('u1')).toEqual(second);
    });

    it('keeps users apart', async () => {
      await store.save({ id: 'u1', displayName: 'Dana', phoneNumber: null });
      await store.save({ id: 'u2', displayName: 'Avi', phoneNumber: null });

      expect((await store.get('u1'))?.displayName).toBe('Dana');
      expect((await store.get('u2'))?.displayName).toBe('Avi');
    });
  });
}
