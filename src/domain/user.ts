/** A signed-in user. Phone number is the primary identity (WhatsApp-style). */
export interface AuthUser {
  id: string;
  phoneNumber: string | null;
  email: string | null;
}
