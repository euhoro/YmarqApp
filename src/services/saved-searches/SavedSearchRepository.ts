/** A search the user wants to hear about: new listings matching `query` trigger an alert. */
export interface SavedSearch {
  id: string;
  userId: string;
  /** Trimmed search text, matched like the search box (case-insensitive substring). */
  query: string;
  /** ISO timestamp. */
  createdAt: string;
}

/**
 * The signed-in user's saved searches ("alerts"). Implementations: fake (in memory) now, the API
 * (#50) later.
 */
export interface SavedSearchRepository {
  /** The user's saved searches, newest first. */
  listSavedSearches(): Promise<SavedSearch[]>;
  /**
   * Saves `query` (trimmed; must not be empty). Saving a query the user already has, ignoring
   * case, returns the existing one instead of a duplicate.
   */
  saveSearch(query: string): Promise<SavedSearch>;
  /** Deletes one of the user's saved searches. Unknown ids are ignored. */
  deleteSavedSearch(id: string): Promise<void>;
}

/** The key two queries share when they count as the same saved search. */
export function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase();
}

/** The saved search for `query` (ignoring case and surrounding spaces), if there is one. */
export function findSavedSearch(
  searches: readonly SavedSearch[],
  query: string,
): SavedSearch | undefined {
  const key = normalizeQuery(query);
  return searches.find((s) => normalizeQuery(s.query) === key);
}
