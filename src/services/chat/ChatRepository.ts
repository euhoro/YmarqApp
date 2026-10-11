/** One chat message. `sentAt` is an ISO timestamp. */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  sentAt: string;
}

/** A buyer talking to a seller about one listing. There is at most one per (listing, buyer). */
export interface Conversation {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  /** The newest message, or null if nobody has written yet. */
  lastMessage: Message | null;
  /** ISO timestamp of the last activity (creation or newest message); the inbox sorts by it. */
  updatedAt: string;
}

/**
 * Chats between buyers and sellers, always for the signed-in user.
 * Implementations: fake (in memory) now, the API (#49) later.
 */
export interface ChatRepository {
  /** Opens the user's conversation about a listing with its seller, creating it the first time. */
  startConversation(productId: string): Promise<Conversation>;
  /** The user's conversations (as buyer or seller), newest activity first. */
  listConversations(): Promise<Conversation[]>;
  /** One of the user's conversations, or null if it doesn't exist. */
  getConversation(conversationId: string): Promise<Conversation | null>;
  /** Messages in a conversation, oldest first. */
  listMessages(conversationId: string): Promise<Message[]>;
  /** Sends a message as the user; returns it. */
  sendMessage(conversationId: string, text: string): Promise<Message>;
}

/** The person on the other side of a conversation. */
export function otherParticipant(conversation: Conversation, userId: string): string {
  return conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
}
