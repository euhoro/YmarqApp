import { eq } from 'drizzle-orm';

import type { Profile, ProfileInput } from '../../domain/profile.js';
import type { ProfileStore } from '../ProfileStore.js';
import type { PostgresDatabase } from './PostgresProductStore.js';
import { profiles } from './schema.js';

export class PostgresProfileStore implements ProfileStore {
  constructor(private readonly db: PostgresDatabase) {}

  async get(id: string): Promise<Profile | null> {
    const [row] = await this.db.select().from(profiles).where(eq(profiles.id, id));
    return row ?? null;
  }

  async save(input: ProfileInput): Promise<Profile> {
    const now = new Date();
    const [row] = await this.db
      .insert(profiles)
      .values({ ...input, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { displayName: input.displayName, phoneNumber: input.phoneNumber, updatedAt: now },
      })
      .returning();
    return row!;
  }
}
