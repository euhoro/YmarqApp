import { desc, eq, ilike, or } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import type { NewProduct, Product } from '../../domain/product.js';
import type { ProductStore } from '../ProductStore.js';
import { products } from './schema.js';

/** Any Drizzle Postgres database: Neon (production) or PGlite (tests). */
export type PostgresDatabase = PgDatabase<PgQueryResultHKT>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Escapes LIKE wildcards so user text matches literally (`100%` finds "100%"). */
const likePattern = (query: string) => `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

const toProduct = (row: typeof products.$inferSelect): Product => ({
  ...row,
  currency: row.currency as Product['currency'],
});

export class PostgresProductStore implements ProductStore {
  constructor(private readonly db: PostgresDatabase) {}

  async list(): Promise<Product[]> {
    const rows = await this.db.select().from(products).orderBy(desc(products.createdAt));
    return rows.map(toProduct);
  }

  async get(id: string): Promise<Product | null> {
    if (!UUID.test(id)) return null;
    const [row] = await this.db.select().from(products).where(eq(products.id, id));
    return row ? toProduct(row) : null;
  }

  async search(query: string): Promise<Product[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.list();
    const pattern = likePattern(trimmed);
    const rows = await this.db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.description, pattern),
          ilike(products.hashtag, pattern),
          ilike(products.category, pattern),
          ilike(products.location, pattern),
        ),
      )
      .orderBy(desc(products.createdAt));
    return rows.map(toProduct);
  }

  async create(input: NewProduct): Promise<Product> {
    const [row] = await this.db.insert(products).values(input).returning();
    return toProduct(row!);
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const deleted = await this.db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    return deleted.length > 0;
  }
}
