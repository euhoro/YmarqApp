import type { ExpoPushMessage, ExpoPushReceipt, ExpoPushTicket } from 'expo-server-sdk';
import { describe, expect, it, vi } from 'vitest';

import { devVerifier } from '../../auth/verifier.js';
import { createApp } from '../../createApp.js';
import type { Product } from '../../domain/product.js';
import { createStores } from '../../stores/index.js';
import { createPushNotifier, type ExpoPushClient } from '../pushNotifier.js';

const AVI_PHONE = 'ExponentPushToken[avi-phone]';
const AVI_TABLET = 'ExponentPushToken[avi-tablet]';
const DANA_PHONE = 'ExponentPushToken[dana-phone]';
const EVE_PHONE = 'ExponentPushToken[eve-phone]';
const MINUTE = 60 * 1000;

/**
 * Stands in for Expo's push API: records what was sent and answers each message with an ok
 * ticket, unless `tickets` / `receipts` say otherwise for a token / receipt id.
 */
function fakeExpo({
  tickets = {},
  receipts = {},
}: {
  tickets?: Record<string, ExpoPushTicket>;
  receipts?: Record<string, ExpoPushReceipt>;
} = {}) {
  const sent: ExpoPushMessage[] = [];
  let nextId = 1;
  const expo = {
    chunkPushNotifications: (messages: ExpoPushMessage[]) => (messages.length ? [messages] : []),
    chunkPushNotificationReceiptIds: (ids: string[]) => (ids.length ? [ids] : []),
    sendPushNotificationsAsync: vi.fn(async (messages: ExpoPushMessage[]) => {
      sent.push(...messages);
      return messages.map(
        (m): ExpoPushTicket => tickets[m.to as string] ?? { status: 'ok', id: `r${nextId++}` },
      );
    }),
    getPushNotificationReceiptsAsync: vi.fn(async (ids: string[]) =>
      Object.fromEntries(ids.map((id) => [id, receipts[id] ?? { status: 'ok' as const }])),
    ),
  } satisfies ExpoPushClient;
  return { expo, sent };
}

const DEAD = {
  status: 'error',
  message: 'not registered',
  details: { error: 'DeviceNotRegistered' },
} as const;

async function setup(expoFake = fakeExpo()) {
  const stores = createStores('memory');
  let now = new Date();
  const push = createPushNotifier({
    devices: stores.devices,
    profiles: stores.profiles,
    expo: expoFake.expo,
    now: () => now,
  });
  await stores.devices.register('avi', AVI_PHONE);
  await stores.devices.register('avi', AVI_TABLET);
  await stores.devices.register('dana', DANA_PHONE);
  await stores.devices.register('eve', EVE_PHONE);
  const later = (ms: number) => (now = new Date(now.getTime() + ms));
  return { stores, push, later, ...expoFake };
}

const PRODUCT: Product = {
  id: 'p1',
  publisherId: 'dana',
  description: 'Suzuki Swift 2012, one owner',
  hashtag: '#car',
  imageUrl: null,
  price: null,
  currency: null,
  category: 'Vehicles',
  location: 'Tel Aviv',
  createdAt: new Date(),
};

describe('createPushNotifier', () => {
  it('pushes a new chat message to every phone of the recipient, titled with the sender', async () => {
    const { stores, push, sent } = await setup();
    await stores.profiles.save({ id: 'dana', displayName: 'Dana', phoneNumber: null });

    await push.onMessageCreated({
      type: 'message.created',
      message: {
        id: 'm1',
        conversationId: 'c1',
        senderId: 'dana',
        text: 'Yes, still available',
        sentAt: new Date(),
      },
      conversation: {} as never,
      recipientId: 'avi',
    });

    expect(sent.map((m) => m.to).sort()).toEqual([AVI_PHONE, AVI_TABLET]);
    expect(sent[0]).toMatchObject({
      title: 'Dana',
      body: 'Yes, still available',
      data: { type: 'message.created', conversationId: 'c1', url: '/chats/c1' },
    });
  });

  it('pushes a matched listing once per user, never to its publisher', async () => {
    const { push, sent } = await setup();

    await push.onListingMatched({
      type: 'listing.matched',
      product: { ...PRODUCT, description: 'x'.repeat(400) },
      matches: [
        { savedSearchId: 's1', userId: 'eve', query: 'swift' },
        { savedSearchId: 's2', userId: 'eve', query: 'suzuki' },
        { savedSearchId: 's3', userId: 'dana', query: 'swift' },
      ],
    });

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: EVE_PHONE,
      title: 'New listing for “swift”',
      data: { type: 'listing.matched', productId: 'p1', url: '/listing/p1' },
    });
    expect(sent[0]!.body).toHaveLength(150);
  });

  it('sends nothing to users without phones', async () => {
    const { push, expo } = await setup();

    await push.onListingMatched({
      type: 'listing.matched',
      product: PRODUCT,
      matches: [{ savedSearchId: 's1', userId: 'nobody', query: 'swift' }],
    });

    expect(expo.sendPushNotificationsAsync).not.toHaveBeenCalled();
  });

  it('removes a token right away when the send ticket says it is not registered', async () => {
    const { stores, push } = await setup(fakeExpo({ tickets: { [AVI_TABLET]: DEAD } }));

    await push.onListingMatched({
      type: 'listing.matched',
      product: PRODUCT,
      matches: [{ savedSearchId: 's1', userId: 'avi', query: 'swift' }],
    });

    expect((await stores.devices.listForUsers(['avi'])).map((d) => d.token)).toEqual([AVI_PHONE]);
  });

  it('checks receipts once they are ready and removes dead tokens', async () => {
    const { stores, push, later, expo } = await setup(fakeExpo({ receipts: { r2: DEAD } }));
    const matchFor = (userId: string) => ({
      type: 'listing.matched' as const,
      product: PRODUCT,
      matches: [{ savedSearchId: 's1', userId, query: 'swift' }],
    });

    await push.onListingMatched(matchFor('avi')); // tickets r1, r2 (Avi's two phones)
    expect(expo.getPushNotificationReceiptsAsync).not.toHaveBeenCalled();

    later(16 * MINUTE);
    await push.onListingMatched(matchFor('eve'));

    expect(expo.getPushNotificationReceiptsAsync).toHaveBeenCalledWith(['r1', 'r2']);
    const left = (await stores.devices.listForUsers(['avi'])).map((d) => d.token);
    expect(left).toHaveLength(1);

    // Each receipt is checked once.
    later(16 * MINUTE);
    await push.checkReceipts();
    expect(expo.getPushNotificationReceiptsAsync).toHaveBeenLastCalledWith(['r3']);
  });

  it('a failing receipts check does not fail the send', async () => {
    const expoFake = fakeExpo();
    expoFake.expo.getPushNotificationReceiptsAsync.mockRejectedValue(new Error('Expo down'));
    const { push, later, sent } = await setup(expoFake);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const match = {
      type: 'listing.matched' as const,
      product: PRODUCT,
      matches: [{ savedSearchId: 's1', userId: 'eve', query: 'swift' }],
    };

    await push.onListingMatched(match);
    later(16 * MINUTE);
    await expect(push.onListingMatched(match)).resolves.toBeUndefined();

    expect(sent).toHaveLength(2);
    expect(spy).toHaveBeenCalledWith('push receipts check failed', expect.any(Error));
    spy.mockRestore();
  });
});

describe('push notifications through the API', () => {
  it('a chat message reaches the seller’s phone, not the buyer’s', async () => {
    const { expo, sent } = fakeExpo();
    const stores = createStores('memory');
    const push = createPushNotifier({ devices: stores.devices, profiles: stores.profiles, expo });
    const app = createApp({
      stores,
      verifyToken: devVerifier,
      onMessageCreated: push.onMessageCreated,
      onListingMatched: push.onListingMatched,
    });
    const post = (user: string, path: string, body: unknown) =>
      app.request(path, {
        method: 'POST',
        headers: { Authorization: `Bearer dev:${user}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

    await post('dana', '/v1/devices', { token: DANA_PHONE });
    await post('avi', '/v1/devices', { token: AVI_PHONE });
    await post('eve', '/v1/saved-searches', { query: 'swift' });
    await post('eve', '/v1/devices', { token: EVE_PHONE });
    const product = await (
      await post('dana', '/v1/products', { description: 'Suzuki Swift' })
    ).json();
    const conversation = await (
      await post('avi', '/v1/conversations', { productId: product.id })
    ).json();
    await post('avi', `/v1/conversations/${conversation.id}/messages`, {
      text: 'Still available?',
    });

    expect(sent.map((m) => [m.to, m.title])).toEqual([
      [EVE_PHONE, 'New listing for “swift”'],
      [DANA_PHONE, 'New message'],
    ]);
  });
});
