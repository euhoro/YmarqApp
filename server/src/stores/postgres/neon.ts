import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

/** Neon over HTTP: the right driver for short-lived Vercel Functions (no connection pool to keep). */
export function createNeonDatabase(databaseUrl: string): NeonHttpDatabase {
  return drizzle({ client: neon(databaseUrl) });
}
