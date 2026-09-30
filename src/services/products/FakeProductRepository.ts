import { parseLegacyProducts, type Product } from '@/domain/product';

import type { ProductRepository } from './ProductRepository';

/** Sample data in the legacy wire format. The first entry is the legacy app's own mock. */
export const FAKE_LEGACY_PRODUCTS = [
  {
    Description: 'Suzuki Swift',
    Hashtag: 'Nice car',
    Id: 'e7b6646b-4718-4abf-8260-73188d395c30',
    Image: '',
    PublisherId: '',
  },
  {
    Description: 'Mountain bike, 29"',
    Hashtag: '#bike #sport',
    Id: '3f1c2a9e-5b7d-4c61-9a0e-1d2b3c4d5e6f',
    Image: '',
    PublisherId: 'demo-user',
  },
  {
    Description: 'Wooden dining table',
    Hashtag: '#furniture',
    Id: '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d',
    Image: '',
    PublisherId: 'demo-user',
  },
];

export class FakeProductRepository implements ProductRepository {
  constructor(private readonly products: Product[] = parseLegacyProducts(FAKE_LEGACY_PRODUCTS)) {}

  async listProducts(_userId: string): Promise<Product[]> {
    return [...this.products];
  }
}
