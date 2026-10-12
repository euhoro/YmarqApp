import type { ChatStore } from './ChatStore.js';
import { InMemoryChatStore } from './InMemoryChatStore.js';
import { InMemoryProductStore } from './InMemoryProductStore.js';
import { createNeonDatabase } from './postgres/neon.js';
import { PostgresChatStore } from './postgres/PostgresChatStore.js';
import { PostgresProductStore } from './postgres/PostgresProductStore.js';
import type { ProductStore } from './ProductStore.js';

export type { ChatStore } from './ChatStore.js';
export type { ProductStore } from './ProductStore.js';

export interface Stores {
  products: ProductStore;
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
      chat: new InMemoryChatStore(),
    };
  }
  if (store === 'postgres') {
    if (!databaseUrl) throw new Error('STORE=postgres needs DATABASE_URL.');
    const db = createNeonDatabase(databaseUrl);
    return {
      products: new PostgresProductStore(db),
      chat: new PostgresChatStore(db),
    };
  }
  throw new Error(`Unknown STORE=${store}. Use memory or postgres.`);
}
