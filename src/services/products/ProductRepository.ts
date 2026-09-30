import type { Product } from '@/domain/product';

/**
 * The only way the app reads products. Implementations: fake (default),
 * Firestore (F2c) and the legacy backend. Pick one with EXPO_PUBLIC_DATA_SOURCE.
 */
export interface ProductRepository {
  /** Products visible to the given user (legacy: `GetProducts/{userCode}`). */
  listProducts(userId: string): Promise<Product[]>;
}
