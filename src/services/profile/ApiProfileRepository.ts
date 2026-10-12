import { z } from 'zod';

import type { Profile } from '@/domain/user';

import type { ApiClient } from '../api/ApiClient';
import type { ProfileRepository } from './ProfileRepository';

/** `GET /v1/users/{id}` and `PUT /v1/me` (`server/src/routes/profile.ts`). */
const ApiPublicProfileSchema = z.object({ id: z.string(), displayName: z.string() });

const toProfile = (json: unknown): Profile => {
  const { id, displayName } = ApiPublicProfileSchema.parse(json);
  return { userId: id, displayName };
};

/** Profiles stored on the Ymarq API, keyed by the sign-in user id. */
export class ApiProfileRepository implements ProfileRepository {
  constructor(private readonly client: ApiClient) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const json = await this.client.requestOrNull(`/v1/users/${encodeURIComponent(userId)}`);
    return json === null ? null : toProfile(json);
  }

  /** Saves the signed-in user's name; the server takes the user id from the token. */
  async saveProfile(profile: Profile): Promise<Profile> {
    const body = { displayName: profile.displayName };
    return toProfile(await this.client.request('/v1/me', { method: 'PUT', body }));
  }
}
