/** A signed-in user. Phone number is the primary identity (WhatsApp-style). */
export interface AuthUser {
  id: string;
  phoneNumber: string | null;
  email: string | null;
}

/** What other users see about someone: their chosen display name. */
export interface Profile {
  userId: string;
  displayName: string;
}

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 40;

/** Trimmed name, or null if it's too short or too long. */
export function normalizeDisplayName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, ' ');
  return name.length >= DISPLAY_NAME_MIN && name.length <= DISPLAY_NAME_MAX ? name : null;
}
