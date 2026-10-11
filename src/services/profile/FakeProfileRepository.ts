import type { Profile } from '@/domain/user';

import { DEMO_USER } from '../auth/FakeAuthService';
import type { ProfileRepository } from './ProfileRepository';

/** In-memory profiles. The legacy demo user already has a name; new phone sign-ins don't. */
export class FakeProfileRepository implements ProfileRepository {
  private profiles = new Map<string, Profile>();

  constructor(initial: Profile[] = [{ userId: DEMO_USER.id, displayName: 'Demo user' }]) {
    initial.forEach((profile) => this.profiles.set(profile.userId, profile));
  }

  async getProfile(userId: string): Promise<Profile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    this.profiles.set(profile.userId, profile);
    return profile;
  }
}
