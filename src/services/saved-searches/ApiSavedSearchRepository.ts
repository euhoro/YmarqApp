import { z } from 'zod';

import { ApiError, type ApiClient } from '../api/ApiClient';
import type { SavedSearch, SavedSearchRepository } from './SavedSearchRepository';

/** `server/src/routes/saved-searches.ts` shape. */
const ApiSavedSearchSchema = z.object({
  id: z.string(),
  userId: z.string(),
  query: z.string(),
  createdAt: z.string(),
});

const toSavedSearch = (json: unknown): SavedSearch => ApiSavedSearchSchema.parse(json);

/** The signed-in user's saved searches, stored on the Ymarq API (which also sends the alerts). */
export class ApiSavedSearchRepository implements SavedSearchRepository {
  constructor(private readonly client: ApiClient) {}

  async listSavedSearches(): Promise<SavedSearch[]> {
    const json = await this.client.request('/v1/saved-searches');
    return z.array(z.unknown()).parse(json).map(toSavedSearch);
  }

  /** The server trims the query and returns the existing search for a duplicate. */
  async saveSearch(query: string): Promise<SavedSearch> {
    const trimmed = query.trim();
    if (!trimmed) throw new Error('Type something to search for first.');
    const body = { query: trimmed };
    return toSavedSearch(await this.client.request('/v1/saved-searches', { method: 'POST', body }));
  }

  async deleteSavedSearch(id: string): Promise<void> {
    try {
      await this.client.request(`/v1/saved-searches/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      // Already gone (or never ours): nothing to delete.
      if (error instanceof ApiError && error.status === 404) return;
      throw error;
    }
  }
}
