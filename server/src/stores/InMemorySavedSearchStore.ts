import { randomUUID } from 'node:crypto';

import { queryMatchesListing } from '../matching/listingMatched.js';
import {
  compareNewestFirst,
  type ListingText,
  type SavedSearch,
  type SavedSearchStore,
} from './SavedSearchStore.js';

const key = (query: string) => query.trim().toLocaleLowerCase();

export class InMemorySavedSearchStore implements SavedSearchStore {
  private searches: SavedSearch[] = [];

  async list(userId: string): Promise<SavedSearch[]> {
    return this.searches.filter((s) => s.userId === userId).sort(compareNewestFirst);
  }

  async save(userId: string, query: string) {
    const existing = this.searches.find((s) => s.userId === userId && key(s.query) === key(query));
    if (existing) return { savedSearch: existing, created: false };
    const savedSearch: SavedSearch = { id: randomUUID(), userId, query, createdAt: new Date() };
    this.searches.push(savedSearch);
    return { savedSearch, created: true };
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const before = this.searches.length;
    this.searches = this.searches.filter((s) => !(s.id === id && s.userId === userId));
    return this.searches.length < before;
  }

  async findMatching(listing: ListingText): Promise<SavedSearch[]> {
    return this.searches
      .filter((s) => s.userId !== listing.publisherId && queryMatchesListing(s.query, listing))
      .sort((a, b) => compareNewestFirst(b, a));
  }
}
