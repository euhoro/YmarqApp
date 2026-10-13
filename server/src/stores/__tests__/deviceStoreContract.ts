import { beforeEach, describe, expect, it } from 'vitest';

import type { DeviceStore } from '../DeviceStore.js';

const PHONE_A = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
const PHONE_B = 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]';
const PHONE_C = 'ExponentPushToken[cccccccccccccccccccccc]';
const tokens = (devices: { token: string }[]) => devices.map((d) => d.token).sort();

/** Behaviour every DeviceStore must have. Call it from each implementation's test file. */
export function deviceStoreContract(name: string, createStore: () => Promise<DeviceStore>) {
  describe(`${name} (DeviceStore contract)`, () => {
    let store: DeviceStore;

    beforeEach(async () => {
      store = await createStore();
    });

    it('registers tokens per user and lists them for a set of users', async () => {
      const device = await store.register('avi', PHONE_A);
      expect(device).toEqual({ token: PHONE_A, userId: 'avi', updatedAt: expect.any(Date) });
      await store.register('avi', PHONE_B);
      await store.register('eve', PHONE_C);

      expect(tokens(await store.listForUsers(['avi']))).toEqual([PHONE_A, PHONE_B]);
      expect(tokens(await store.listForUsers(['avi', 'eve']))).toEqual([PHONE_A, PHONE_B, PHONE_C]);
      expect(await store.listForUsers([])).toEqual([]);
      expect(await store.listForUsers(['nobody'])).toEqual([]);
    });

    it('registering the same token again keeps one device and moves it to the new user', async () => {
      await store.register('avi', PHONE_A);
      await store.register('avi', PHONE_A);
      expect(await store.listForUsers(['avi'])).toHaveLength(1);

      await store.register('eve', PHONE_A);
      expect(await store.listForUsers(['avi'])).toEqual([]);
      expect(tokens(await store.listForUsers(['eve']))).toEqual([PHONE_A]);
    });

    it('unregisters only the user’s own token', async () => {
      await store.register('avi', PHONE_A);

      expect(await store.unregister('eve', PHONE_A)).toBe(false);
      expect(await store.unregister('avi', PHONE_B)).toBe(false);
      expect(await store.unregister('avi', PHONE_A)).toBe(true);
      expect(await store.listForUsers(['avi'])).toEqual([]);
    });

    it('removes dead tokens whoever owns them', async () => {
      await store.register('avi', PHONE_A);
      await store.register('eve', PHONE_B);

      await store.remove([PHONE_A, PHONE_B, PHONE_C]);
      await store.remove([]);
      expect(await store.listForUsers(['avi', 'eve'])).toEqual([]);
    });

    it('takes tickets created before a time, oldest first, each only once', async () => {
      const at = (minute: number) => new Date(Date.UTC(2026, 9, 13, 12, minute));
      await store.addTickets([{ id: 'r4', token: PHONE_A }], at(30));
      await store.addTickets(
        [
          { id: 'r2', token: PHONE_B },
          { id: 'r3', token: PHONE_C },
        ],
        at(10),
      );
      await store.addTickets([{ id: 'r1', token: PHONE_A }], at(0));
      await store.addTickets([], at(0));

      const first = await store.takeTickets(at(20), 2);
      expect(first.map((t) => t.id)).toEqual(['r1', expect.stringMatching(/^r[23]$/)]);
      expect(first[0]).toEqual({ id: 'r1', token: PHONE_A, createdAt: at(0) });
      expect(await store.takeTickets(at(20), 10)).toHaveLength(1);
      expect(await store.takeTickets(at(20), 10)).toEqual([]);
      expect((await store.takeTickets(at(31), 10)).map((t) => t.id)).toEqual(['r4']);
    });
  });
}
