import { getApiUrl, getDataSource, type DataSource } from '@/config/env';

import { ApiClient, type TokenProvider } from '../api/ApiClient';
import { ApiProfileRepository } from './ApiProfileRepository';
import { FakeProfileRepository } from './FakeProfileRepository';
import type { ProfileRepository } from './ProfileRepository';

export type { ProfileRepository } from './ProfileRepository';

/** Profiles live on the API for `api`; the other sources keep them in memory. */
export function createProfileRepository(
  source: DataSource = getDataSource(),
  getToken: TokenProvider = async () => null,
): ProfileRepository {
  if (source === 'api') return new ApiProfileRepository(new ApiClient(getApiUrl(), getToken));
  return new FakeProfileRepository();
}
