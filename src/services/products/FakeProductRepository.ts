import { parseLegacyProducts, type Product } from '@/domain/product';

import type { ProductRepository } from './ProductRepository';

/**
 * Sample data in the legacy wire format. The first entry is the 2014 app's own mock.
 * Photos: picsum.photos by fixed id (Unsplash licence); the Suzuki Swift is a public-domain photo from
 * Wikimedia Commons ("2009 Suzuki Swift (RS416) Sport 5-door hatchback (2009-06-06).jpg").
 */
export const FAKE_LEGACY_PRODUCTS = [
  {
    Description: 'Suzuki Swift',
    Hashtag: 'Nice car',
    Id: 'e7b6646b-4718-4abf-8260-73188d395c30',
    Image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/2009_Suzuki_Swift_%28RS416%29_Sport_5-door_hatchback_%282009-06-06%29.jpg/960px-2009_Suzuki_Swift_%28RS416%29_Sport_5-door_hatchback_%282009-06-06%29.jpg',
    PublisherId: '',
  },
  {
    Description: 'MacBook Air 13", like new',
    Hashtag: '#laptop #apple',
    Id: '3c9f1e52-8a41-4f0b-9d2e-6b7a1c5d8e01',
    Image: 'https://picsum.photos/id/0/800/450',
    PublisherId: 'demo-dana',
  },
  {
    Description: 'Wooden dining table, seats 8',
    Hashtag: '#furniture',
    Id: '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d',
    Image: 'https://picsum.photos/id/42/800/450',
    PublisherId: 'demo-user',
  },
  {
    Description: 'Record player, works great',
    Hashtag: '#vinyl #music',
    Id: '5d2e8f71-3b6a-4c9d-8e1f-2a4b6c8d0e12',
    Image: 'https://picsum.photos/id/39/800/450',
    PublisherId: 'demo-yossi',
  },
  {
    Description: 'Red high heels, size 38',
    Hashtag: '#fashion #shoes',
    Id: '7e1a2b3c-4d5e-4f60-8a9b-0c1d2e3f4a23',
    Image: 'https://picsum.photos/id/21/800/450',
    PublisherId: 'demo-dana',
  },
  {
    Description: "Kids' tricycle",
    Hashtag: '#kids',
    Id: '1f2e3d4c-5b6a-4798-8a7b-6c5d4e3f2a34',
    Image: 'https://picsum.photos/id/146/800/450',
    PublisherId: 'demo-user',
  },
  {
    Description: 'Vintage film camera',
    Hashtag: '#camera #photography',
    Id: '2a3b4c5d-6e7f-4a8b-9c0d-1e2f3a4b5c45',
    Image: 'https://picsum.photos/id/91/800/450',
    PublisherId: 'demo-yossi',
  },
  {
    Description: 'Classic car, restored',
    Hashtag: '#car #classic',
    Id: '8b9c0d1e-2f3a-4b4c-8d5e-6f7a8b9c0d56',
    Image: 'https://picsum.photos/id/111/800/450',
    PublisherId: 'demo-avi',
  },
  {
    Description: 'Ceramic mug',
    Hashtag: '#home #kitchen',
    Id: '4c5d6e7f-8a9b-4c0d-9e1f-2a3b4c5d6e67',
    Image: 'https://picsum.photos/id/30/800/450',
    PublisherId: 'demo-avi',
  },
];

export class FakeProductRepository implements ProductRepository {
  constructor(private readonly products: Product[] = parseLegacyProducts(FAKE_LEGACY_PRODUCTS)) {}

  async listProducts(_userId: string): Promise<Product[]> {
    return [...this.products];
  }
}
