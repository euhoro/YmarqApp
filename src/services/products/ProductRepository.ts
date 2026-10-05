import type { NewProduct, Product } from '@/domain/product';

/**
 * The only way the app reads products. Implementations: fake (default),
 * the Ymarq API (#36) and the legacy backend. Pick one with EXPO_PUBLIC_DATA_SOURCE.
 */
export interface ProductRepository {
  /** Products visible to the given user (legacy: `GetProducts/{userCode}`). */
  listProducts(userId: string): Promise<Product[]>;
  /** One product, or null if it doesn't exist. */
  getProduct(id: string): Promise<Product | null>;
  /** Case-insensitive substring match over description, hashtag, category and location (`ILIKE '%q%'`). */
  searchProducts(query: string): Promise<Product[]>;
  /** Publishes a listing; returns it with its new id. */
  createProduct(input: NewProduct): Promise<Product>;
}
