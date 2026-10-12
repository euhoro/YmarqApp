import { randomUUID } from 'node:crypto';

import {
  compareConversations,
  compareMessages,
  type ChatStore,
  type Conversation,
  type Message,
  type MessageCursor,
  type NewConversation,
  type NewMessage,
} from './ChatStore.js';

type StoredConversation = Omit<Conversation, 'lastMessage' | 'updatedAt'>;

export class InMemoryChatStore implements ChatStore {
  private conversations: StoredConversation[] = [];
  private messages: Message[] = [];

  async openConversation(input: NewConversation) {
    const existing = this.conversations.find(
      (c) => c.productId === input.productId && c.buyerId === input.buyerId,
    );
    if (existing) return { conversation: this.withActivity(existing), created: false };
    const stored: StoredConversation = { id: randomUUID(), createdAt: new Date(), ...input };
    this.conversations.push(stored);
    return { conversation: this.withActivity(stored), created: true };
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const stored = this.conversations.find((c) => c.id === id);
    return stored ? this.withActivity(stored) : null;
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    return this.conversations
      .filter((c) => c.buyerId === userId || c.sellerId === userId)
      .map((c) => this.withActivity(c))
      .sort(compareConversations);
  }

  async getMessage(id: string): Promise<Message | null> {
    return this.messages.find((m) => m.id === id) ?? null;
  }

  async listMessages(conversationId: string, after?: MessageCursor): Promise<Message[]> {
    return this.messages
      .filter((m) => m.conversationId === conversationId)
      .filter(
        (m) => !after || compareMessages(m, { sentAt: after.sentAt, id: after.id ?? '~' }) > 0,
      )
      .sort(compareMessages);
  }

  async addMessage(input: NewMessage): Promise<Message> {
    const message: Message = { id: randomUUID(), sentAt: new Date(), ...input };
    this.messages.push(message);
    return message;
  }

  private withActivity(stored: StoredConversation): Conversation {
    const own = this.messages.filter((m) => m.conversationId === stored.id).sort(compareMessages);
    const lastMessage = own.at(-1) ?? null;
    return { ...stored, lastMessage, updatedAt: lastMessage?.sentAt ?? stored.createdAt };
  }
}
