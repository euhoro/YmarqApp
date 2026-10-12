import type { AuthService } from '../auth/AuthService';
import { FakeSavedSearchRepository } from './FakeSavedSearchRepository';
import type { SavedSearchRepository } from './SavedSearchRepository';

export type { SavedSearch, SavedSearchRepository } from './SavedSearchRepository';
export { findSavedSearch, normalizeQuery } from './SavedSearchRepository';

/** The fake for every data source for now; the API implementation (#50) replaces it here. */
export function createSavedSearchRepository(auth: AuthService): SavedSearchRepository {
  return new FakeSavedSearchRepository(auth);
}
