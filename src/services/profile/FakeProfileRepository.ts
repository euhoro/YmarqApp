import type { Profile } from '@/domain/user';

import { DEMO_USER } from '../auth/FakeAuthService';
import type { ProfileRepository } from './ProfileRepository';

/** Sellers of the sample listings (FakeProductRepository), so details screens show real names. */
export const DEMO_SELLERS: Profile[] = [
  { userId: 'demo-user', displayName: 'Noa' },
  { userId: 'demo-dana', displayName: 'Dana' },
  { userId: 'demo-yossi', displayName: 'Yossi' },
  { userId: 'demo-avi', displayName: 'Avi' },
];

/** In-memory profiles. The legacy demo user already has a name; new phone sign-ins don't. */
export class FakeProfileRepository implements ProfileRepository {
  private profiles = new Map<string, Profile>();

  constructor(
    initial: Profile[] = [{ userId: DEMO_USER.id, displayName: 'Demo user' }, ...DEMO_SELLERS],
  ) {
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
