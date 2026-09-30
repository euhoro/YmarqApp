import { getDataSource, getLegacyApiUrl, type DataSource } from '@/config/env';

import { FakeProductRepository } from './FakeProductRepository';
import { LegacyApiProductRepository } from './LegacyApiProductRepository';
import type { ProductRepository } from './ProductRepository';

export type { ProductRepository } from './ProductRepository';

export function createProductRepository(source: DataSource = getDataSource()): ProductRepository {
  switch (source) {
    case 'fake':
      return new FakeProductRepository();
    case 'legacy':
      return new LegacyApiProductRepository(getLegacyApiUrl());
    case 'firestore':
      throw new Error('The Firestore data source is not implemented yet (tracked as F2c).');
  }
}
