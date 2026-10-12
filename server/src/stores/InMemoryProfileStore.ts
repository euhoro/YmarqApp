import type { Profile, ProfileInput } from '../domain/profile.js';
import type { ProfileStore } from './ProfileStore.js';

export class InMemoryProfileStore implements ProfileStore {
  private profiles = new Map<string, Profile>();

  async get(id: string): Promise<Profile | null> {
    return this.profiles.get(id) ?? null;
  }

  async save(input: ProfileInput): Promise<Profile> {
    const now = new Date();
    const profile: Profile = {
      createdAt: this.profiles.get(input.id)?.createdAt ?? now,
      ...input,
      updatedAt: now,
    };
    this.profiles.set(input.id, profile);
    return profile;
  }
}
