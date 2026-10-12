import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import type { ChatStore, NewConversation } from '../ChatStore.js';

const UNKNOWN = '00000000-0000-0000-0000-000000000000';
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

/** Behaviour every ChatStore must have. Call it from each implementation's test file. */
export function chatStoreContract(name: string, createStore: () => Promise<ChatStore>) {
  describe(`${name} (ChatStore contract)`, () => {
    let store: ChatStore;
    const about = (productId = randomUUID(), buyerId = 'buyer'): NewConversation => ({
      productId,
      buyerId,
      sellerId: 'seller',
    });

    beforeEach(async () => {
      store = await createStore();
    });

    it('opens a conversation once per product and buyer', async () => {
      const input = about();
      const first = await store.openConversation(input);

      expect(first.created).toBe(true);
      expect(first.conversation).toMatchObject({
        ...input,
        id: expect.any(String),
        lastMessage: null,
      });
      expect(first.conversation.createdAt).toBeInstanceOf(Date);
      expect(first.conversation.updatedAt).toEqual(first.conversation.createdAt);

      const again = await store.openConversation(input);
      expect(again).toEqual({ conversation: first.conversation, created: false });

      const otherBuyer = await store.openConversation({ ...input, buyerId: 'buyer-2' });
      expect(otherBuyer.created).toBe(true);
      expect(otherBuyer.conversation.id).not.toBe(first.conversation.id);
    });

    it('returns conversations by id, null when unknown', async () => {
      const { conversation } = await store.openConversation(about());

      expect(await store.getConversation(conversation.id)).toEqual(conversation);
      expect(await store.getConversation(UNKNOWN)).toBeNull();
      expect(await store.getConversation('not-a-uuid')).toBeNull();
    });

    it('stores messages oldest first and tracks the last one', async () => {
      const { conversation } = await store.openConversation(about());
      const hello = await store.addMessage({
        conversationId: conversation.id,
        senderId: 'buyer',
        text: 'Hello',
      });
      await tick();
      const reply = await store.addMessage({
        conversationId: conversation.id,
        senderId: 'seller',
        text: 'Hi!',
      });

      expect(hello).toMatchObject({
        conversationId: conversation.id,
        senderId: 'buyer',
        text: 'Hello',
      });
      expect(hello.sentAt).toBeInstanceOf(Date);
      expect(await store.getMessage(hello.id)).toEqual(hello);
      expect(await store.getMessage(UNKNOWN)).toBeNull();
      expect(await store.listMessages(conversation.id)).toEqual([hello, reply]);

      const updated = await store.getConversation(conversation.id);
      expect(updated?.lastMessage).toEqual(reply);
      expect(updated?.updatedAt).toEqual(reply.sentAt);
    });

    it('lists messages after a time or after a message', async () => {
      const { conversation } = await store.openConversation(about());
      const send = (text: string) =>
        store.addMessage({ conversationId: conversation.id, senderId: 'buyer', text });
      const one = await send('one');
      await tick();
      const two = await send('two');
      await tick();
      const three = await send('three');

      expect(await store.listMessages(conversation.id, { sentAt: one.sentAt })).toEqual([
        two,
        three,
      ]);
      expect(await store.listMessages(conversation.id, two)).toEqual([three]);
      expect(await store.listMessages(conversation.id, three)).toEqual([]);
      expect(await store.listMessages(UNKNOWN)).toEqual([]);
    });

    it('never skips messages sent in the same millisecond when reading after a message', async () => {
      const { conversation } = await store.openConversation(about());
      const sent = await Promise.all(
        ['a', 'b', 'c', 'd'].map((text) =>
          store.addMessage({ conversationId: conversation.id, senderId: 'buyer', text }),
        ),
      );
      const all = await store.listMessages(conversation.id);
      expect(all).toHaveLength(sent.length);

      // Paging one message at a time returns each message exactly once.
      const paged = [all[0]!];
      for (let i = 0; i < all.length - 1; i++) {
        const [next] = await store.listMessages(conversation.id, paged.at(-1)!);
        paged.push(next!);
      }
      expect(paged).toEqual(all);
    });

    it("lists a user's conversations as buyer or seller, newest activity first", async () => {
      const older = (await store.openConversation(about(randomUUID(), 'dana'))).conversation;
      await tick();
      const newer = (await store.openConversation(about(randomUUID(), 'dana'))).conversation;
      await tick();
      await store.openConversation(about(randomUUID(), 'avi'));

      expect((await store.listConversations('dana')).map((c) => c.id)).toEqual([
        newer.id,
        older.id,
      ]);

      await tick();
      const message = await store.addMessage({
        conversationId: older.id,
        senderId: 'seller',
        text: 'Still interested?',
      });
      const danas = await store.listConversations('dana');
      expect(danas.map((c) => c.id)).toEqual([older.id, newer.id]);
      expect(danas[0]?.lastMessage).toEqual(message);

      expect(await store.listConversations('seller')).toHaveLength(3);
      expect(await store.listConversations('nobody')).toEqual([]);
    });
  });
}
