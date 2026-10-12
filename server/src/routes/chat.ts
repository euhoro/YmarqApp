import type { Context } from 'hono';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import type { AppEnv } from '../env.js';
import type { Conversation, Message, MessageCursor } from '../stores/ChatStore.js';

/** Fired after a message is stored; push notifications (#51) listen to it. */
export interface MessageCreatedEvent {
  type: 'message.created';
  message: Message;
  conversation: Conversation;
  /** The participant who did not send the message. */
  recipientId: string;
}

export type MessageCreatedHandler = (event: MessageCreatedEvent) => void | Promise<void>;

export interface ChatRouteOptions {
  onMessageCreated?: MessageCreatedHandler;
}

const OpenConversationSchema = z.object({ productId: z.string().trim().min(1).max(100) });
const NewMessageSchema = z.object({ text: z.string().trim().min(1).max(2000) });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** JSON shape of a message (dates as ISO strings); matches the app's `Message`. */
const messageJson = (message: Message) => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  text: message.text,
  sentAt: message.sentAt.toISOString(),
});

/** JSON shape of a conversation; matches the app's `Conversation` (plus `createdAt`). */
const conversationJson = (conversation: Conversation) => ({
  id: conversation.id,
  productId: conversation.productId,
  buyerId: conversation.buyerId,
  sellerId: conversation.sellerId,
  lastMessage: conversation.lastMessage ? messageJson(conversation.lastMessage) : null,
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
});

/** The conversation `:id`, if the caller takes part in it: 404 when unknown, 403 for outsiders. */
async function participantConversation(c: Context<AppEnv>) {
  const conversation = await c.get('stores').chat.getConversation(c.req.param('id') ?? '');
  if (!conversation) throw new HTTPException(404, { message: 'Conversation not found' });
  const userId = c.get('user').id;
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new HTTPException(403, { message: 'Not your conversation' });
  }
  return conversation;
}

/** `?after=` is a message id (preferred: never skips or repeats) or an ISO time. */
async function readCursor(c: Context<AppEnv>, conversationId: string) {
  const after = c.req.query('after');
  if (!after) return undefined;
  if (UUID.test(after)) {
    const message = await c.get('stores').chat.getMessage(after);
    if (!message || message.conversationId !== conversationId) {
      throw new HTTPException(400, { message: 'Unknown message in after' });
    }
    return { sentAt: message.sentAt, id: message.id } satisfies MessageCursor;
  }
  const time = new Date(after);
  if (Number.isNaN(time.getTime())) {
    throw new HTTPException(400, { message: 'after must be a message id or an ISO time' });
  }
  return { sentAt: time } satisfies MessageCursor;
}

/**
 * `/v1/conversations`: a buyer's chat with the seller about one listing. Only the two participants
 * can read or write a conversation.
 */
export function chatRoutes({ onMessageCreated = () => {} }: ChatRouteOptions = {}) {
  return new Hono<AppEnv>()
    .post('/', async (c) => {
      const parsed = OpenConversationSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) {
        return c.json({ error: 'Invalid conversation', issues: parsed.error.issues }, 400);
      }
      const { products, chat } = c.get('stores');
      const product = await products.get(parsed.data.productId);
      if (!product) throw new HTTPException(404, { message: 'Listing not found' });
      const buyerId = c.get('user').id;
      if (product.publisherId === buyerId) {
        throw new HTTPException(400, { message: "You can't message yourself" });
      }
      const { conversation, created } = await chat.openConversation({
        productId: product.id,
        buyerId,
        sellerId: product.publisherId,
      });
      return c.json(conversationJson(conversation), created ? 201 : 200);
    })
    .get('/', async (c) => {
      const found = await c.get('stores').chat.listConversations(c.get('user').id);
      return c.json(found.map(conversationJson));
    })
    .get('/:id', async (c) => c.json(conversationJson(await participantConversation(c))))
    .get('/:id/messages', async (c) => {
      const conversation = await participantConversation(c);
      const after = await readCursor(c, conversation.id);
      const found = await c.get('stores').chat.listMessages(conversation.id, after);
      return c.json(found.map(messageJson));
    })
    .post('/:id/messages', async (c) => {
      const conversation = await participantConversation(c);
      const parsed = NewMessageSchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) {
        return c.json({ error: 'Invalid message', issues: parsed.error.issues }, 400);
      }
      const senderId = c.get('user').id;
      const message = await c.get('stores').chat.addMessage({
        conversationId: conversation.id,
        senderId,
        text: parsed.data.text,
      });
      const recipientId =
        senderId === conversation.buyerId ? conversation.sellerId : conversation.buyerId;
      try {
        // Awaited so work like push delivery finishes before a serverless function is frozen.
        await onMessageCreated({
          type: 'message.created',
          message,
          conversation: { ...conversation, lastMessage: message, updatedAt: message.sentAt },
          recipientId,
        });
      } catch (error) {
        // The message is stored; a failing listener must not turn the send into an error.
        console.error('message.created listener failed', error);
      }
      return c.json(messageJson(message), 201);
    });
}
