import type { Product } from '../domain/product.js';
import type { ListingText, SavedSearchStore } from '../stores/SavedSearchStore.js';

/** The listing fields product search looks in (and saved searches are matched against). */
export const LISTING_SEARCH_FIELDS = ['description', 'hashtag', 'category', 'location'] as const;

/** True when `query` is a case-insensitive substring of one of the listing's searchable fields. */
export function queryMatchesListing(query: string, listing: ListingText): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return false;
  return LISTING_SEARCH_FIELDS.some((field) =>
    (listing[field] ?? '').toLocaleLowerCase().includes(needle),
  );
}

export interface ListingMatch {
  savedSearchId: string;
  userId: string;
  query: string;
}

/** Fired once after a listing is created, when other users' saved searches match it. */
export interface ListingMatchedEvent {
  type: 'listing.matched';
  product: Product;
  matches: ListingMatch[];
}

export type ListingMatchedHandler = (event: ListingMatchedEvent) => void | Promise<void>;

/**
 * Matches a new listing against saved searches and calls `onListingMatched` when any match.
 * Never throws: the listing is already stored, so failures are only logged.
 */
export async function announceListing(
  savedSearches: SavedSearchStore,
  product: Product,
  onListingMatched: ListingMatchedHandler,
): Promise<void> {
  try {
    const found = await savedSearches.findMatching(product);
    if (found.length === 0) return;
    // Awaited so work like push delivery finishes before a serverless function is frozen.
    await onListingMatched({
      type: 'listing.matched',
      product,
      matches: found.map(({ id, userId, query }) => ({ savedSearchId: id, userId, query })),
    });
  } catch (error) {
    console.error('listing.matched failed', error);
  }
}
