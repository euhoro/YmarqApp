import { z } from 'zod';

import type { ApiClient } from '../api/ApiClient';
import type { ChatRepository, Conversation, Message } from './ChatRepository';

/** `server/src/routes/chat.ts` shapes (extra fields such as `createdAt` are dropped). */
const ApiMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  text: z.string(),
  sentAt: z.string(),
});

const ApiConversationSchema = z.object({
  id: z.string(),
  productId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  lastMessage: ApiMessageSchema.nullable(),
  updatedAt: z.string(),
});

const toConversation = (json: unknown): Conversation => ApiConversationSchema.parse(json);
const toMessage = (json: unknown): Message => ApiMessageSchema.parse(json);

const conversationPath = (id: string) => `/v1/conversations/${encodeURIComponent(id)}`;

/** Chats stored on the Ymarq API; only the buyer and seller of a conversation can read it. */
export class ApiChatRepository implements ChatRepository {
  constructor(private readonly client: ApiClient) {}

  async startConversation(productId: string): Promise<Conversation> {
    const body = { productId };
    return toConversation(await this.client.request('/v1/conversations', { method: 'POST', body }));
  }

  async listConversations(): Promise<Conversation[]> {
    return z
      .array(z.unknown())
      .parse(await this.client.request('/v1/conversations'))
      .map(toConversation);
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    // 403 (someone else's chat) looks the same as a missing one to the user.
    const json = await this.client.requestOrNull(conversationPath(conversationId), [403, 404]);
    return json === null ? null : toConversation(json);
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    const json = await this.client.request(`${conversationPath(conversationId)}/messages`);
    return z.array(z.unknown()).parse(json).map(toMessage);
  }

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    const path = `${conversationPath(conversationId)}/messages`;
    return toMessage(await this.client.request(path, { method: 'POST', body: { text } }));
  }
}
