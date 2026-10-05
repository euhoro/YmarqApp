import { parseLegacyProducts, type Product } from '@/domain/product';

import type { ProductRepository } from './ProductRepository';

/**
 * Talks to the legacy backend's contract: `GET {baseUrl}/photos/GetProducts/{userCode}`
 * returning a JSON array of LegacyProduct. Plug the revived backend in by setting
 * EXPO_PUBLIC_DATA_SOURCE=legacy and EXPO_PUBLIC_LEGACY_API_URL.
 */
export class LegacyApiProductRepository implements ProductRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async listProducts(userId: string): Promise<Product[]> {
    const url = `${this.baseUrl}/photos/GetProducts/${encodeURIComponent(userId)}`;
    const response = await this.fetchFn(url);
    if (!response.ok) {
      throw new Error(`Legacy API ${url} failed with HTTP ${response.status}`);
    }
    return parseLegacyProducts(await response.json());
  }

  // The 2014 server had only GetProducts; the new API (#34) adds the rest.
  async getProduct(): Promise<Product | null> {
    throw new Error('Not supported by the legacy API.');
  }

  async searchProducts(): Promise<Product[]> {
    throw new Error('Not supported by the legacy API.');
  }

  async createProduct(): Promise<Product> {
    throw new Error('Not supported by the legacy API.');
  }
}
