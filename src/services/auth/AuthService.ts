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
  /**
   * False until the saved session has been restored (Firebase reads it asynchronously after a reload).
   * Until then `getCurrentUser()` is null even for signed-in users, so the auth gate waits.
   */
  isReady(): boolean;
  getCurrentUser(): AuthUser | null;
  /** Calls `listener` now and on every change (including becoming ready). Returns an unsubscribe function. */
  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void;
  /** Sends an SMS code. `phoneNumber` is in E.164 format, e.g. +972501234567. */
  startPhoneSignIn(phoneNumber: string): Promise<PhoneVerification>;
  signOut(): Promise<void>;
  /** Bearer token for the Ymarq API, or null when signed out (Firebase ID token; `dev:<id>` when fake). */
  getIdToken(): Promise<string | null>;
  /** Shown on the sign-in screen when the service is a demo (e.g. which code to type). */
  readonly demoHint?: string;
}
