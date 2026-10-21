import {
  getAuth,
  getIdToken,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type User,
} from '@react-native-firebase/auth';
import type { FirebaseOptions } from 'firebase/app';

import type { AuthUser } from '@/domain/user';

import { AuthError, type AuthService, type PhoneVerification } from './AuthService';
import { toAuthError } from './firebaseErrors';

const toAuthUser = (user: User): AuthUser => ({
  id: user.uid,
  phoneNumber: user.phoneNumber,
  email: user.email,
});

/**
 * Firebase phone sign-in on iOS/Android: the native SDK (React Native Firebase). The app's Firebase
 * config comes from `GoogleService-Info.plist` / `google-services.json`, built into the app by EAS
 * (see `app.config.ts`); the session is kept by the native SDK across restarts.
 */
export class FirebaseAuthService implements AuthService {
  private user: AuthUser | null = null;
  private ready = false;
  private listeners = new Set<(user: AuthUser | null) => void>();

  constructor(private readonly auth: Auth) {
    onAuthStateChanged(auth, (firebaseUser) => {
      this.user = firebaseUser ? toAuthUser(firebaseUser) : null;
      this.ready = true;
      this.listeners.forEach((listener) => listener(this.user));
    });
  }

  isReady(): boolean {
    return this.ready;
  }

  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.user);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async startPhoneSignIn(phoneNumber: string): Promise<PhoneVerification> {
    try {
      // The native SDK proves the request comes from our app (APNs / Play Integrity, or a reCAPTCHA
      // page as fallback), so no verifier is passed.
      const confirmation = await signInWithPhoneNumber(this.auth, phoneNumber);
      return {
        confirm: async (code) => {
          try {
            const credential = await confirmation.confirm(code);
            if (!credential) throw new AuthError('Sign-in did not complete. Try again.');
            return toAuthUser(credential.user);
          } catch (error) {
            throw toAuthError(error);
          }
        },
      };
    } catch (error) {
      throw toAuthError(error);
    }
  }

  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? getIdToken(user) : null;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}

/** Native apps read their Firebase config from the bundled files, not from the web config. */
export function createFirebaseAuthService(_getWebConfig: () => FirebaseOptions): AuthService {
  return new FirebaseAuthService(getAuth());
}
