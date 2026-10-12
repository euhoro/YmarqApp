import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import { InMemoryProfileStore } from '../InMemoryProfileStore.js';
import { PostgresProfileStore } from '../postgres/PostgresProfileStore.js';
import { profileStoreContract } from './profileStoreContract.js';

profileStoreContract('InMemoryProfileStore', async () => new InMemoryProfileStore());

profileStoreContract('PostgresProfileStore (PGlite)', async () => {
  const db = drizzle({ client: new PGlite() });
  await migrate(db, { migrationsFolder: './drizzle' });
  return new PostgresProfileStore(db);
});
