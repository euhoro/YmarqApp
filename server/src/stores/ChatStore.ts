/** One chat message. */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: Date;
}

/** A buyer talking to a seller about one listing. There is at most one per (product, buyer). */
export interface Conversation {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  createdAt: Date;
  /** The newest message, or null if nobody has written yet. */
  lastMessage: Message | null;
  /** Last activity: the newest message's `sentAt`, or `createdAt`. */
  updatedAt: Date;
}

export interface NewConversation {
  productId: string;
  buyerId: string;
  sellerId: string;
}

export interface NewMessage {
  conversationId: string;
  senderId: string;
  text: string;
}

/**
 * Where to resume reading: messages sent strictly after `sentAt`. With `id` (a message's own cursor),
 * messages sent in the same millisecond but ordered after that message are included too.
 */
export interface MessageCursor {
  sentAt: Date;
  id?: string;
}

/**
 * Conversations and messages. Implementations: InMemoryChatStore (tests, local dev) and
 * PostgresChatStore. Every implementation must pass `__tests__/chatStoreContract.ts`.
 * Messages are ordered by (`sentAt`, `id`); timestamps have millisecond precision.
 */
export interface ChatStore {
  /** Returns the conversation for (productId, buyerId), creating it the first time. */
  openConversation(
    input: NewConversation,
  ): Promise<{ conversation: Conversation; created: boolean }>;
  /** Null for unknown ids (including ids that are not UUIDs). */
  getConversation(id: string): Promise<Conversation | null>;
  /** The user's conversations as buyer or seller, newest activity first. */
  listConversations(userId: string): Promise<Conversation[]>;
  /** Null for unknown ids (including ids that are not UUIDs). */
  getMessage(id: string): Promise<Message | null>;
  /** Messages of a conversation, oldest first, optionally only those after `after`. */
  listMessages(conversationId: string, after?: MessageCursor): Promise<Message[]>;
  addMessage(input: NewMessage): Promise<Message>;
}

/** Orders messages by (sentAt, id). */
export function compareMessages(
  a: Pick<Message, 'sentAt' | 'id'>,
  b: Pick<Message, 'sentAt' | 'id'>,
) {
  return a.sentAt.getTime() - b.sentAt.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/** Orders conversations newest activity first. */
export function compareConversations(a: Conversation, b: Conversation) {
  return b.updatedAt.getTime() - a.updatedAt.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}
