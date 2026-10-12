import type { ChatStore } from './ChatStore.js';
import { InMemoryChatStore } from './InMemoryChatStore.js';
import { InMemoryProductStore } from './InMemoryProductStore.js';
import { InMemoryProfileStore } from './InMemoryProfileStore.js';
import { createNeonDatabase } from './postgres/neon.js';
import { PostgresChatStore } from './postgres/PostgresChatStore.js';
import { PostgresProductStore } from './postgres/PostgresProductStore.js';
import { PostgresProfileStore } from './postgres/PostgresProfileStore.js';
import type { ProductStore } from './ProductStore.js';
import type { ProfileStore } from './ProfileStore.js';

export type { ChatStore } from './ChatStore.js';
export type { ProductStore } from './ProductStore.js';
export type { ProfileStore } from './ProfileStore.js';

export interface Stores {
  products: ProductStore;
  profiles: ProfileStore;
  chat: ChatStore;
}

/** Picks the storage backend from `STORE`: memory (default) or postgres (needs `DATABASE_URL`). */
export function createStores(
  store = process.env.STORE ?? 'memory',
  databaseUrl = process.env.DATABASE_URL,
): Stores {
  if (store === 'memory') {
    return {
      products: new InMemoryProductStore(),
      profiles: new InMemoryProfileStore(),
      chat: new InMemoryChatStore(),
    };
  }
  if (store === 'postgres') {
    if (!databaseUrl) throw new Error('STORE=postgres needs DATABASE_URL.');
    const db = createNeonDatabase(databaseUrl);
    return {
      products: new PostgresProductStore(db),
      profiles: new PostgresProfileStore(db),
      chat: new PostgresChatStore(db),
    };
  }
  throw new Error(`Unknown STORE=${store}. Use memory or postgres.`);
}
