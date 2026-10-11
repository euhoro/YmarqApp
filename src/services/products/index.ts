import { getApiUrl, getDataSource, getLegacyApiUrl, type DataSource } from '@/config/env';

import { ApiProductRepository, type TokenProvider } from './ApiProductRepository';

import { FakeProductRepository } from './FakeProductRepository';
import { LegacyApiProductRepository } from './LegacyApiProductRepository';
import type { ProductRepository } from './ProductRepository';

export type { ProductRepository } from './ProductRepository';

const NO_TOKEN: TokenProvider = async () => null;

/** `getToken` supplies the signed-in user's bearer token for the server-backed sources. */
export function createProductRepository(
  source: DataSource = getDataSource(),
  getToken: TokenProvider = NO_TOKEN,
): ProductRepository {
  switch (source) {
    case 'fake':
      return new FakeProductRepository();
    case 'api':
      return new ApiProductRepository(getApiUrl(), getToken);
    case 'legacy':
      return new LegacyApiProductRepository(getLegacyApiUrl(), fetch, getToken);
  }
}
