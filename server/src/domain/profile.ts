import { z } from 'zod';

/** A user's profile, keyed by the Firebase user id (the token's `sub`). */
export interface Profile {
  id: string;
  displayName: string;
  /** From the sign-in token; never shown to other users. */
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ProfileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
});

export type ProfileInput = z.infer<typeof ProfileInputSchema> & {
  id: string;
  phoneNumber: string | null;
};
