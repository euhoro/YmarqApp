import type { AuthService } from '../auth/AuthService';
import type { ProductRepository } from '../products/ProductRepository';
import type { ChatRepository } from './ChatRepository';
import { FakeChatRepository } from './FakeChatRepository';

export type { ChatRepository, Conversation, Message } from './ChatRepository';
export { otherParticipant } from './ChatRepository';

/** The API implementation (#49) replaces the fake here. */
export function createChatRepository(
  auth: AuthService,
  products: ProductRepository,
): ChatRepository {
  return new FakeChatRepository(auth, products);
}
