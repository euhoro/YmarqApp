import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import { InMemoryDeviceStore } from '../InMemoryDeviceStore.js';
import { PostgresDeviceStore } from '../postgres/PostgresDeviceStore.js';
import { deviceStoreContract } from './deviceStoreContract.js';

deviceStoreContract('InMemoryDeviceStore', async () => new InMemoryDeviceStore());

deviceStoreContract('PostgresDeviceStore (PGlite)', async () => {
  const db = drizzle({ client: new PGlite() });
  await migrate(db, { migrationsFolder: './drizzle' });
  return new PostgresDeviceStore(db);
});
