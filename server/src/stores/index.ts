import type { ChatStore } from './ChatStore.js';
import type { DeviceStore } from './DeviceStore.js';
import { InMemoryChatStore } from './InMemoryChatStore.js';
import { InMemoryDeviceStore } from './InMemoryDeviceStore.js';
import { InMemoryProductStore } from './InMemoryProductStore.js';
import { InMemoryProfileStore } from './InMemoryProfileStore.js';
import { InMemorySavedSearchStore } from './InMemorySavedSearchStore.js';
import { createNeonDatabase } from './postgres/neon.js';
import { PostgresChatStore } from './postgres/PostgresChatStore.js';
import { PostgresDeviceStore } from './postgres/PostgresDeviceStore.js';
import { PostgresProductStore } from './postgres/PostgresProductStore.js';
import { PostgresProfileStore } from './postgres/PostgresProfileStore.js';
import { PostgresSavedSearchStore } from './postgres/PostgresSavedSearchStore.js';
import type { ProductStore } from './ProductStore.js';
import type { ProfileStore } from './ProfileStore.js';
import type { SavedSearchStore } from './SavedSearchStore.js';

export type { ChatStore } from './ChatStore.js';
export type { DeviceStore } from './DeviceStore.js';
export type { ProductStore } from './ProductStore.js';
export type { ProfileStore } from './ProfileStore.js';
export type { SavedSearchStore } from './SavedSearchStore.js';

export interface Stores {
  products: ProductStore;
  profiles: ProfileStore;
  chat: ChatStore;
  savedSearches: SavedSearchStore;
  devices: DeviceStore;
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
      savedSearches: new InMemorySavedSearchStore(),
      devices: new InMemoryDeviceStore(),
    };
  }
  if (store === 'postgres') {
    if (!databaseUrl) throw new Error('STORE=postgres needs DATABASE_URL.');
    const db = createNeonDatabase(databaseUrl);
    return {
      products: new PostgresProductStore(db),
      profiles: new PostgresProfileStore(db),
      chat: new PostgresChatStore(db),
      savedSearches: new PostgresSavedSearchStore(db),
      devices: new PostgresDeviceStore(db),
    };
  }
  throw new Error(`Unknown STORE=${store}. Use memory or postgres.`);
}
