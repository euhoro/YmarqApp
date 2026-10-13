import { getApiUrl, getDataSource, type DataSource } from '@/config/env';

import { ApiClient } from '../api/ApiClient';
import type { AuthService } from '../auth/AuthService';
import { ApiSavedSearchRepository } from './ApiSavedSearchRepository';
import { FakeSavedSearchRepository } from './FakeSavedSearchRepository';
import type { SavedSearchRepository } from './SavedSearchRepository';

export type { SavedSearch, SavedSearchRepository } from './SavedSearchRepository';
export { findSavedSearch, normalizeQuery } from './SavedSearchRepository';

/** Saved searches live on the API for `api`; the other sources use the in-memory fake. */
export function createSavedSearchRepository(
  auth: AuthService,
  source: DataSource = getDataSource(),
): SavedSearchRepository {
  if (source === 'api') {
    return new ApiSavedSearchRepository(new ApiClient(getApiUrl(), () => auth.getIdToken()));
  }
  return new FakeSavedSearchRepository(auth);
}
