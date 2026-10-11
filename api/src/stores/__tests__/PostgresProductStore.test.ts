import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { describe, expect, it } from 'vitest';

import { PostgresProductStore } from '../postgres/PostgresProductStore.js';
import { productStoreContract } from './productStoreContract.js';

/** A fresh in-process Postgres with the real migrations applied. */
async function createStore() {
  const db = drizzle({ client: new PGlite() });
  await migrate(db, { migrationsFolder: './drizzle' });
  return new PostgresProductStore(db);
}

productStoreContract('PostgresProductStore (PGlite)', createStore);

describe('PostgresProductStore specifics', () => {
  it('returns null / false for ids that are not UUIDs instead of failing', async () => {
    const store = await createStore();

    expect(await store.get('local-123')).toBeNull();
    expect(await store.delete('not-a-uuid')).toBe(false);
  });

  it('keeps prices as numbers and optional fields as null', async () => {
    const store = await createStore();
    const created = await store.create({
      publisherId: 'u1',
      description: 'Lamp',
      hashtag: '',
      imageUrl: null,
      price: 99.5,
      currency: 'EUR',
      category: null,
      location: null,
    });

    expect(await store.get(created.id)).toMatchObject({
      price: 99.5,
      currency: 'EUR',
      category: null,
      location: null,
      imageUrl: null,
    });
  });
});
