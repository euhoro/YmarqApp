import { InMemoryProductStore } from './InMemoryProductStore.js';
import type { ProductStore } from './ProductStore.js';

export type { ProductStore } from './ProductStore.js';

export interface Stores {
  products: ProductStore;
}

/** Picks the storage backend from `STORE` (memory | postgres). Postgres arrives in #32. */
export function createStores(store = process.env.STORE ?? 'memory'): Stores {
  if (store === 'memory') return { products: new InMemoryProductStore() };
  throw new Error(`STORE=${store} is not available yet (Postgres arrives in #32).`);
}
