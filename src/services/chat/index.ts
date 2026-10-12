import { getApiUrl, getDataSource, type DataSource } from '@/config/env';

import { ApiClient } from '../api/ApiClient';
import type { AuthService } from '../auth/AuthService';
import type { ProductRepository } from '../products/ProductRepository';
import { ApiChatRepository } from './ApiChatRepository';
import type { ChatRepository } from './ChatRepository';
import { FakeChatRepository } from './FakeChatRepository';

export type { ChatRepository, Conversation, Message } from './ChatRepository';
export { otherParticipant } from './ChatRepository';

/** Chats live on the API for `api`; the other sources use the in-memory fake (scripted replies). */
export function createChatRepository(
  auth: AuthService,
  products: ProductRepository,
  source: DataSource = getDataSource(),
): ChatRepository {
  if (source === 'api') {
    return new ApiChatRepository(new ApiClient(getApiUrl(), () => auth.getIdToken()));
  }
  return new FakeChatRepository(auth, products);
}
