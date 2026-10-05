import type { NewProduct, Product } from '../domain/product.js';

/**
 * Where listings live. Implementations: InMemoryProductStore (tests, local dev) and
 * PostgresProductStore (#32). DynamoDB could be added behind the same interface.
 * Every implementation must pass the contract tests in `__tests__/productStoreContract.ts`.
 */
export interface ProductStore {
  /** Newest first. */
  list(): Promise<Product[]>;
  get(id: string): Promise<Product | null>;
  /** Case-insensitive substring match over description, hashtag, category, location (`ILIKE '%q%'`). */
  search(query: string): Promise<Product[]>;
  create(input: NewProduct): Promise<Product>;
  /** Returns false when there was nothing to delete. */
  delete(id: string): Promise<boolean>;
}
