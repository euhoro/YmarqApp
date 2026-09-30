import type { AuthUser } from '@/domain/user';

/** A pending phone sign-in: the SMS was sent, and the user must enter the code. */
export interface PhoneVerification {
  confirm(code: string): Promise<AuthUser>;
}

/**
 * The only way the app deals with identity. Implementations: fake (default)
 * and Firebase Auth (F6: native SDK on iOS/Android, JS SDK + reCAPTCHA on web).
 */
export interface AuthService {
  getCurrentUser(): AuthUser | null;
  /** Calls `listener` now and on every change. Returns an unsubscribe function. */
  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void;
  /** Sends an SMS code. `phoneNumber` is in E.164 format, e.g. +972501234567. */
  startPhoneSignIn(phoneNumber: string): Promise<PhoneVerification>;
  signOut(): Promise<void>;
}
