import { z } from 'zod';

import type { NewProduct, Product } from '@/domain/product';

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

/** Returns the bearer token for the signed-in user, or null when signed out. */
export type TokenProvider = () => Promise<string | null>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Reads and writes listings through the Ymarq API (`/v1/products`), signed in with the user's token. */
export class ApiProductRepository implements ProductRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: TokenProvider,
    // Wrapped: browsers throw "Illegal invocation" when fetch is called as a method of another object.
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async listProducts(): Promise<Product[]> {
    return z
      .array(z.unknown())
      .parse(await this.request('/v1/products'))
      .map(toProduct);
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      return toProduct(await this.request(`/v1/products/${encodeURIComponent(id)}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    const path = `/v1/products?q=${encodeURIComponent(query.trim())}`;
    return z
      .array(z.unknown())
      .parse(await this.request(path))
      .map(toProduct);
  }

  async createProduct(input: NewProduct): Promise<Product> {
    // The server sets the publisher from the token; publisherId is not sent.
    const { publisherId: _publisherId, ...body } = input;
    return toProduct(await this.request('/v1/products', { method: 'POST', body }));
  }

  private async request(path: string, options: { method?: string; body?: unknown } = {}) {
    const token = await this.getToken();
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        json && typeof json === 'object' && 'error' in json
          ? String(json.error)
          : response.statusText;
      throw new ApiError(response.status, message || `HTTP ${response.status}`);
    }
    return json;
  }
}
