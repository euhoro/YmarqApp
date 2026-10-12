import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import { PostgresChatStore } from '../postgres/PostgresChatStore.js';
import { chatStoreContract } from './chatStoreContract.js';

/** A fresh in-process Postgres with the real migrations applied. */
async function createStore() {
  const db = drizzle({ client: new PGlite() });
  await migrate(db, { migrationsFolder: './drizzle' });
  return new PostgresChatStore(db);
}

chatStoreContract('PostgresChatStore (PGlite)', createStore);
