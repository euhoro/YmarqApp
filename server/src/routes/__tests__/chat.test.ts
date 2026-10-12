import { describe, expect, it, vi } from 'vitest';

import { devVerifier } from '../../auth/verifier.js';
import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';
import type { MessageCreatedHandler } from '../chat.js';

const UNKNOWN = '00000000-0000-0000-0000-000000000000';
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

function setup(onMessageCreated?: MessageCreatedHandler) {
  const app = createApp({
    stores: createStores('memory'),
    verifyToken: devVerifier,
    onMessageCreated,
  });
  const as = (user: string) => ({
    get: (path: string) => app.request(path, { headers: { Authorization: `Bearer dev:${user}` } }),
    post: (path: string, body: unknown) =>
      app.request(path, {
        method: 'POST',
        headers: { Authorization: `Bearer dev:${user}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
  });
  const dana = as('dana'); // seller
  const avi = as('avi'); // buyer
  const eve = as('eve'); // outsider

  /** Dana's listing and Avi's conversation about it. */
  async function conversation() {
    const product = await (await dana.post('/v1/products', { description: 'Suzuki Swift' })).json();
    const response = await avi.post('/v1/conversations', { productId: product.id });
    return { product, conversation: await response.json(), response };
  }

  return { app, dana, avi, eve, conversation };
}

describe('/v1/conversations', () => {
  it('requires sign-in', async () => {
    const { app } = setup();
    expect((await app.request('/v1/conversations')).status).toBe(401);
    expect((await app.request(`/v1/conversations/${UNKNOWN}/messages`)).status).toBe(401);
  });

  it('opens a conversation with the seller, once per listing and buyer', async () => {
    const { avi, conversation: open } = setup();
    const { product, conversation, response } = await open();

    expect(response.status).toBe(201);
    expect(conversation).toEqual({
      id: expect.any(String),
      productId: product.id,
      buyerId: 'avi',
      sellerId: 'dana',
      lastMessage: null,
      createdAt: expect.any(String),
      updatedAt: conversation.createdAt,
    });

    const again = await avi.post('/v1/conversations', { productId: product.id });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual(conversation);
  });

  it('rejects unknown listings, messaging yourself and bad input', async () => {
    const { dana, avi, conversation } = setup();
    const { product } = await conversation();

    expect((await avi.post('/v1/conversations', { productId: UNKNOWN })).status).toBe(404);
    expect((await avi.post('/v1/conversations', { productId: 'local-1' })).status).toBe(404);
    const self = await dana.post('/v1/conversations', { productId: product.id });
    expect(self.status).toBe(400);
    expect(await self.json()).toEqual({ error: "You can't message yourself" });
    expect((await avi.post('/v1/conversations', {})).status).toBe(400);
    expect((await avi.post('/v1/conversations', 'not json')).status).toBe(400);
  });

  it('lets both participants exchange messages, oldest first', async () => {
    const { dana, avi, conversation } = setup();
    const { conversation: chat } = await conversation();
    const path = `/v1/conversations/${chat.id}/messages`;

    const sent = await avi.post(path, { text: '  Is it still available?  ' });
    expect(sent.status).toBe(201);
    const question = await sent.json();
    expect(question).toEqual({
      id: expect.any(String),
      conversationId: chat.id,
      senderId: 'avi',
      text: 'Is it still available?',
      sentAt: expect.any(String),
    });
    await tick();
    const answer = await (await dana.post(path, { text: 'Yes!' })).json();

    expect(await (await avi.get(path)).json()).toEqual([question, answer]);
    expect(await (await dana.get(path)).json()).toEqual([question, answer]);
  });

  it('reads only newer messages with ?after= (message id or ISO time)', async () => {
    const { dana, avi, conversation } = setup();
    const { conversation: chat } = await conversation();
    const path = `/v1/conversations/${chat.id}/messages`;
    const first = await (await avi.post(path, { text: 'one' })).json();
    await tick();
    const second = await (await dana.post(path, { text: 'two' })).json();

    expect(await (await avi.get(`${path}?after=${first.id}`)).json()).toEqual([second]);
    expect(await (await avi.get(`${path}?after=${second.id}`)).json()).toEqual([]);
    expect(
      await (await avi.get(`${path}?after=${encodeURIComponent(first.sentAt)}`)).json(),
    ).toEqual([second]);
    expect((await avi.get(`${path}?after=yesterday`)).status).toBe(400);
    expect((await avi.get(`${path}?after=${UNKNOWN}`)).status).toBe(400);
  });

  it('validates message text (1-2000 characters)', async () => {
    const { avi, conversation } = setup();
    const { conversation: chat } = await conversation();
    const path = `/v1/conversations/${chat.id}/messages`;

    expect((await avi.post(path, { text: '   ' })).status).toBe(400);
    expect((await avi.post(path, { text: 'x'.repeat(2001) })).status).toBe(400);
    expect((await avi.post(path, {})).status).toBe(400);
    expect((await avi.post(path, { text: 'x'.repeat(2000) })).status).toBe(201);
  });

  it('only lets participants read or write (403), 404 for unknown conversations', async () => {
    const { eve, avi, conversation } = setup();
    const { conversation: chat } = await conversation();
    const path = `/v1/conversations/${chat.id}/messages`;

    expect((await eve.get(`/v1/conversations/${chat.id}`)).status).toBe(403);
    expect((await eve.get(path)).status).toBe(403);
    expect((await eve.post(path, { text: 'Hi' })).status).toBe(403);
    expect(await (await avi.get(path)).json()).toEqual([]);

    expect((await avi.get(`/v1/conversations/${UNKNOWN}/messages`)).status).toBe(404);
    expect((await avi.post('/v1/conversations/not-a-uuid/messages', { text: 'Hi' })).status).toBe(
      404,
    );
    expect((await avi.get('/v1/conversations/not-a-uuid')).status).toBe(404);
  });

  it("lists the caller's conversations, newest activity first, with the last message", async () => {
    const { dana, avi, eve, conversation } = setup();
    const { conversation: older } = await conversation();
    await tick();
    const { conversation: newer } = await conversation();

    const ids = async (user: typeof avi) =>
      ((await (await user.get('/v1/conversations')).json()) as { id: string }[]).map((c) => c.id);
    expect(await ids(avi)).toEqual([newer.id, older.id]);
    expect(await ids(dana)).toEqual([newer.id, older.id]);
    expect(await ids(eve)).toEqual([]);

    await tick();
    const message = await (
      await dana.post(`/v1/conversations/${older.id}/messages`, { text: 'Still interested?' })
    ).json();
    const list = await (await avi.get('/v1/conversations')).json();
    expect(list.map((c: { id: string }) => c.id)).toEqual([older.id, newer.id]);
    expect(list[0]).toMatchObject({ lastMessage: message, updatedAt: message.sentAt });
    expect(await (await avi.get(`/v1/conversations/${older.id}`)).json()).toEqual(list[0]);
  });

  it('emits message.created to the recipient after storing a message', async () => {
    const onMessageCreated = vi.fn();
    const { dana, conversation } = setup(onMessageCreated);
    const { conversation: chat } = await conversation();

    const message = await (
      await dana.post(`/v1/conversations/${chat.id}/messages`, { text: 'Hi Avi' })
    ).json();

    expect(onMessageCreated).toHaveBeenCalledTimes(1);
    const [event] = onMessageCreated.mock.calls[0]!;
    expect(event).toMatchObject({
      type: 'message.created',
      recipientId: 'avi',
      message: { id: message.id, senderId: 'dana', text: 'Hi Avi' },
      conversation: { id: chat.id, buyerId: 'avi', sellerId: 'dana' },
    });
  });

  it('still stores and returns the message when a listener fails', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { avi, conversation } = setup(async () => {
      throw new Error('push is down');
    });
    const { conversation: chat } = await conversation();
    const path = `/v1/conversations/${chat.id}/messages`;

    expect((await avi.post(path, { text: 'Hello' })).status).toBe(201);
    expect(await (await avi.get(path)).json()).toHaveLength(1);
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });
});
