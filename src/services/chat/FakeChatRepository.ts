import type { AuthService } from '../auth/AuthService';
import type { ProductRepository } from '../products/ProductRepository';
import type { ChatRepository, Conversation, Message } from './ChatRepository';

/** What the fake seller answers to a buyer's first message. */
export const SCRIPTED_SELLER_REPLY =
  "Hi! Yes, it's still available. When would you like to see it?";

export interface FakeChatOptions {
  /** How long the scripted seller reply takes, in ms (null: no scripted reply). */
  replyDelayMs?: number | null;
  now?: () => Date;
}

interface StoredConversation {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  /** Increases with every change, so ordering is stable even within one millisecond. */
  seq: number;
  messages: Message[];
}

let nextId = 1;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`;

/**
 * In-memory chats for the signed-in user (read from `auth`), on listings from `products`.
 * For demos, the seller replies once, shortly after the buyer's first message.
 */
export class FakeChatRepository implements ChatRepository {
  private conversations = new Map<string, StoredConversation>();
  private seq = 0;
  private readonly replyDelayMs: number | null;
  private readonly now: () => Date;

  constructor(
    private readonly auth: AuthService,
    private readonly products: ProductRepository,
    { replyDelayMs = 1500, now = () => new Date() }: FakeChatOptions = {},
  ) {
    this.replyDelayMs = replyDelayMs;
    this.now = now;
  }

  async startConversation(productId: string): Promise<Conversation> {
    const userId = this.userId();
    const product = await this.products.getProduct(productId);
    if (!product) throw new Error('This listing is not available anymore.');
    if (!product.publisherId) throw new Error('This listing has no seller to message.');
    if (product.publisherId === userId) throw new Error("You can't message yourself.");

    // No await between the lookup and the insert, so concurrent calls can't create duplicates.
    const existing = [...this.conversations.values()].find(
      (c) => c.productId === productId && c.buyerId === userId,
    );
    if (existing) return this.toConversation(existing);

    const conversation: StoredConversation = {
      id: newId('chat'),
      productId,
      buyerId: userId,
      sellerId: product.publisherId,
      createdAt: this.now().toISOString(),
      seq: ++this.seq,
      messages: [],
    };
    this.conversations.set(conversation.id, conversation);
    return this.toConversation(conversation);
  }

  async listConversations(): Promise<Conversation[]> {
    const userId = this.userId();
    return [...this.conversations.values()]
      .filter((c) => c.buyerId === userId || c.sellerId === userId)
      .sort((a, b) => b.seq - a.seq)
      .map((c) => this.toConversation(c));
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const conversation = this.find(conversationId);
    return conversation ? this.toConversation(conversation) : null;
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    return [...this.require(conversationId).messages];
  }

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    const userId = this.userId();
    const conversation = this.require(conversationId);
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Message is empty.');

    const isFirstFromBuyer =
      userId === conversation.buyerId && !conversation.messages.some((m) => m.senderId === userId);
    const message = this.append(conversation, userId, trimmed);
    if (isFirstFromBuyer && this.replyDelayMs !== null) {
      setTimeout(
        () => this.append(conversation, conversation.sellerId, SCRIPTED_SELLER_REPLY),
        this.replyDelayMs,
      );
    }
    return message;
  }

  private append(conversation: StoredConversation, senderId: string, text: string): Message {
    const message: Message = {
      id: newId('msg'),
      conversationId: conversation.id,
      senderId,
      text,
      sentAt: this.now().toISOString(),
    };
    conversation.messages.push(message);
    conversation.seq = ++this.seq;
    return message;
  }

  private userId(): string {
    const user = this.auth.getCurrentUser();
    if (!user) throw new Error('Sign in to use chat.');
    return user.id;
  }

  /** The conversation, if the signed-in user takes part in it. */
  private find(conversationId: string): StoredConversation | undefined {
    const userId = this.userId();
    const conversation = this.conversations.get(conversationId);
    return conversation && (conversation.buyerId === userId || conversation.sellerId === userId)
      ? conversation
      : undefined;
  }

  private require(conversationId: string): StoredConversation {
    const conversation = this.find(conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    return conversation;
  }

  private toConversation(c: StoredConversation): Conversation {
    const lastMessage = c.messages.at(-1) ?? null;
    return {
      id: c.id,
      productId: c.productId,
      buyerId: c.buyerId,
      sellerId: c.sellerId,
      lastMessage: lastMessage ? { ...lastMessage } : null,
      updatedAt: lastMessage?.sentAt ?? c.createdAt,
    };
  }
}
