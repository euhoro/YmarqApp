import { z } from 'zod';

import type { NewProduct, Product } from '@/domain/product';

import { ApiClient, type TokenProvider } from '../api/ApiClient';
import type { ProductRepository } from './ProductRepository';

/** A product as the Ymarq API returns it (`server/src/routes/products.ts`). */
const ApiProductSchema = z.object({
  id: z.string(),
  publisherId: z.string(),
  description: z.string(),
  hashtag: z.string(),
  imageUrl: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.enum(['ILS', 'USD', 'EUR']).nullable(),
  category: z.string().nullable(),
  location: z.string().nullable(),
});

const toProduct = (json: unknown): Product => ApiProductSchema.parse(json);

export { ApiError, type TokenProvider } from '../api/ApiClient';

/** Reads and writes listings through the Ymarq API (`/v1/products`), signed in with the user's token. */
export class ApiProductRepository implements ProductRepository {
  private readonly client: ApiClient;

  constructor(baseUrl: string, getToken: TokenProvider, fetchFn?: typeof fetch) {
    this.client = new ApiClient(baseUrl, getToken, fetchFn);
  }

  async listProducts(): Promise<Product[]> {
    return z
      .array(z.unknown())
      .parse(await this.client.request('/v1/products'))
      .map(toProduct);
  }

  async getProduct(id: string): Promise<Product | null> {
    const json = await this.client.requestOrNull(`/v1/products/${encodeURIComponent(id)}`);
    return json === null ? null : toProduct(json);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const path = `/v1/products?q=${encodeURIComponent(query.trim())}`;
    return z
      .array(z.unknown())
      .parse(await this.client.request(path))
      .map(toProduct);
  }

  async createProduct(input: NewProduct): Promise<Product> {
    // The server sets the publisher from the token; publisherId is not sent.
    const { publisherId: _publisherId, ...body } = input;
    return toProduct(await this.client.request('/v1/products', { method: 'POST', body }));
  }
}
