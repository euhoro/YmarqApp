import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import { InMemorySavedSearchStore } from '../InMemorySavedSearchStore.js';
import { PostgresSavedSearchStore } from '../postgres/PostgresSavedSearchStore.js';
import { savedSearchStoreContract } from './savedSearchStoreContract.js';

savedSearchStoreContract('InMemorySavedSearchStore', async () => new InMemorySavedSearchStore());

savedSearchStoreContract('PostgresSavedSearchStore (PGlite)', async () => {
  const db = drizzle({ client: new PGlite() });
  await migrate(db, { migrationsFolder: './drizzle' });
  return new PostgresSavedSearchStore(db);
});
