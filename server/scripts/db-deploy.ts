// Runs during the Vercel build (see vercel.json). Only acts when the deployment uses Postgres:
// applies pending migrations and, if SEED_SAMPLE_DATA=true and the table is empty, adds sample listings.
import { migrate } from 'drizzle-orm/neon-http/migrator';

import { createNeonDatabase } from '../src/stores/postgres/neon.js';
import { PostgresProductStore } from '../src/stores/postgres/PostgresProductStore.js';
import { SAMPLE_PRODUCTS } from './sample-products.js';

const { STORE, DATABASE_URL, SEED_SAMPLE_DATA } = process.env;

if (STORE !== 'postgres') {
  console.log(`db-deploy: STORE=${STORE ?? 'memory'}, nothing to do.`);
} else if (!DATABASE_URL) {
  throw new Error('db-deploy: STORE=postgres but DATABASE_URL is missing.');
} else {
  const db = createNeonDatabase(DATABASE_URL);
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('db-deploy: migrations applied.');

  if (SEED_SAMPLE_DATA === 'true') {
    const store = new PostgresProductStore(db);
    if ((await store.list()).length === 0) {
      for (const product of SAMPLE_PRODUCTS) await store.create(product);
      console.log(`db-deploy: seeded ${SAMPLE_PRODUCTS.length} sample listings.`);
    } else {
      console.log('db-deploy: products table not empty, seed skipped.');
    }
  }
}
