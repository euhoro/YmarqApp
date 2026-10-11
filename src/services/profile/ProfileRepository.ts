import type { Profile } from '@/domain/user';

/** User profiles. Implementations: fake (in memory) now, the API (`/v1/me`, #48) later. */
export interface ProfileRepository {
  /** The user's profile, or null if they haven't registered a name yet. */
  getProfile(userId: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<Profile>;
}
