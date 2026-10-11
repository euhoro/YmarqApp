import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import type { PostgresDatabase } from './PostgresProductStore.js';

/** Neon over HTTP: the right driver for short-lived Vercel Functions (no connection pool to keep). */
export function createNeonDatabase(databaseUrl: string): PostgresDatabase {
  return drizzle({ client: neon(databaseUrl) });
}
