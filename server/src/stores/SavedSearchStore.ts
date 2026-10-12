import type { Product } from '../domain/product.js';

/** A search a user wants to hear about: new listings matching `query` trigger an alert. */
export interface SavedSearch {
  id: string;
  userId: string;
  /** Trimmed search text, matched like product search (case-insensitive substring). */
  query: string;
  createdAt: Date;
}

/** The parts of a listing a saved search is matched against, plus who published it. */
export type ListingText = Pick<
  Product,
  'publisherId' | 'description' | 'hashtag' | 'category' | 'location'
>;

/**
 * Saved searches ("alerts"). Implementations: InMemorySavedSearchStore (tests, local dev) and
 * PostgresSavedSearchStore. Every implementation must pass `__tests__/savedSearchStoreContract.ts`.
 */
export interface SavedSearchStore {
  /** The user's saved searches, newest first. */
  list(userId: string): Promise<SavedSearch[]>;
  /**
   * Saves `query` (trimmed, non-empty: callers validate). If the user already saved the same
   * query ignoring case, returns that one with `created: false`.
   */
  save(userId: string, query: string): Promise<{ savedSearch: SavedSearch; created: boolean }>;
  /** Deletes one of the user's saved searches. False for unknown ids and other users' searches. */
  delete(userId: string, id: string): Promise<boolean>;
  /**
   * Saved searches of users other than the listing's publisher whose query is a case-insensitive
   * substring of the description, hashtag, category or location (the product search rule).
   * Oldest first.
   */
  findMatching(listing: ListingText): Promise<SavedSearch[]>;
}

/** Orders saved searches newest first. */
export function compareNewestFirst(a: SavedSearch, b: SavedSearch) {
  return b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}
