import type { Profile, ProfileInput } from '../domain/profile.js';

/**
 * Where user profiles live. Implementations: InMemoryProfileStore and PostgresProfileStore.
 * Every implementation must pass the contract tests in `__tests__/profileStoreContract.ts`.
 */
export interface ProfileStore {
  get(id: string): Promise<Profile | null>;
  /** Creates the profile, or updates it (keeping `createdAt`) when it exists. */
  save(input: ProfileInput): Promise<Profile>;
}
