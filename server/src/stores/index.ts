import { InMemoryProductStore } from './InMemoryProductStore.js';
import { createNeonDatabase } from './postgres/neon.js';
import { PostgresProductStore } from './postgres/PostgresProductStore.js';
import type { ProductStore } from './ProductStore.js';

export type { ProductStore } from './ProductStore.js';

export interface Stores {
  products: ProductStore;
}

/** Picks the storage backend from `STORE`: memory (default) or postgres (needs `DATABASE_URL`). */
export function createStores(
  store = process.env.STORE ?? 'memory',
  databaseUrl = process.env.DATABASE_URL,
): Stores {
  if (store === 'memory') return { products: new InMemoryProductStore() };
  if (store === 'postgres') {
    if (!databaseUrl) throw new Error('STORE=postgres needs DATABASE_URL.');
    return { products: new PostgresProductStore(createNeonDatabase(databaseUrl)) };
  }
  throw new Error(`Unknown STORE=${store}. Use memory or postgres.`);
}
