import type { AuthService } from '../auth/AuthService';
import {
  findSavedSearch,
  type SavedSearch,
  type SavedSearchRepository,
} from './SavedSearchRepository';

let nextId = 1;

/** In-memory saved searches for the signed-in user (read from `auth`). */
export class FakeSavedSearchRepository implements SavedSearchRepository {
  /** Oldest first. */
  private searches: SavedSearch[] = [];

  constructor(
    private readonly auth: AuthService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async listSavedSearches(): Promise<SavedSearch[]> {
    const userId = this.userId();
    return this.searches
      .filter((s) => s.userId === userId)
      .reverse()
      .map((s) => ({ ...s }));
  }

  async saveSearch(query: string): Promise<SavedSearch> {
    const userId = this.userId();
    const trimmed = query.trim();
    if (!trimmed) throw new Error('Type something to search for first.');

    const existing = findSavedSearch(
      this.searches.filter((s) => s.userId === userId),
      trimmed,
    );
    if (existing) return { ...existing };

    const search: SavedSearch = {
      id: `search-${Date.now().toString(36)}-${nextId++}`,
      userId,
      query: trimmed,
      createdAt: this.now().toISOString(),
    };
    this.searches.push(search);
    return { ...search };
  }

  async deleteSavedSearch(id: string): Promise<void> {
    const userId = this.userId();
    this.searches = this.searches.filter((s) => !(s.id === id && s.userId === userId));
  }

  private userId(): string {
    const user = this.auth.getCurrentUser();
    if (!user) throw new Error('Sign in to save searches.');
    return user.id;
  }
}
