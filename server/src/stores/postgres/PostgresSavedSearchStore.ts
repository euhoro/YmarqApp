import { and, asc, desc, eq, ne, or, sql } from 'drizzle-orm';

import { LISTING_SEARCH_FIELDS } from '../../matching/listingMatched.js';
import type { ListingText, SavedSearch, SavedSearchStore } from '../SavedSearchStore.js';
import type { PostgresDatabase } from './PostgresProductStore.js';
import { savedSearches } from './schema.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PostgresSavedSearchStore implements SavedSearchStore {
  constructor(private readonly db: PostgresDatabase) {}

  async list(userId: string): Promise<SavedSearch[]> {
    return this.db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, userId))
      .orderBy(desc(savedSearches.createdAt), desc(savedSearches.id));
  }

  async save(userId: string, query: string) {
    // Timestamps are set here (millisecond precision) so they round-trip exactly through JS Dates.
    // A conflict on the (user_id, lower(query)) unique index means the user already saved it.
    const [inserted] = await this.db
      .insert(savedSearches)
      .values({ userId, query, createdAt: new Date() })
      .onConflictDoNothing()
      .returning();
    if (inserted) return { savedSearch: inserted, created: true };

    const [existing] = await this.db
      .select()
      .from(savedSearches)
      .where(
        and(eq(savedSearches.userId, userId), sql`lower(${savedSearches.query}) = lower(${query})`),
      );
    return { savedSearch: existing!, created: false };
  }

  async delete(userId: string, id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    const deleted = await this.db
      .delete(savedSearches)
      .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)))
      .returning({ id: savedSearches.id });
    return deleted.length > 0;
  }

  async findMatching(listing: ListingText): Promise<SavedSearch[]> {
    // Same rule as product search: the query is a case-insensitive substring of a field.
    // `position` (not LIKE) so `%` and `_` in a saved query match literally.
    const fieldMatches = LISTING_SEARCH_FIELDS.map((field) => listing[field])
      .filter((value): value is string => !!value)
      .map((value) => sql`position(lower(${savedSearches.query}) in lower(${value}::text)) > 0`);
    if (fieldMatches.length === 0) return [];
    return this.db
      .select()
      .from(savedSearches)
      .where(and(ne(savedSearches.userId, listing.publisherId), or(...fieldMatches)))
      .orderBy(asc(savedSearches.createdAt), asc(savedSearches.id));
  }
}
