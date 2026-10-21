import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';

import type { AuthUser } from '@/domain/user';

import type { AuthService, PhoneVerification } from './AuthService';
import { toAuthError } from './firebaseErrors';

const toAuthUser = (user: User): AuthUser => ({
  id: user.uid,
  phoneNumber: user.phoneNumber,
  email: user.email,
});

/**
 * Firebase phone sign-in on web: the JS SDK with an invisible reCAPTCHA. The session is kept in
 * IndexedDB, so it survives reloads. iOS/Android use the native SDK instead (F6b).
 */
export class FirebaseAuthService implements AuthService {
  private user: AuthUser | null = null;
  private ready = false;
  private listeners = new Set<(user: AuthUser | null) => void>();
  private recaptcha: { verifier: RecaptchaVerifier; container: HTMLElement } | null = null;

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
      const confirmation = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        this.createRecaptcha(),
      );
      return {
        confirm: async (code) => {
          try {
            return toAuthUser((await confirmation.confirm(code)).user);
          } catch (error) {
            throw toAuthError(error);
          }
        },
      };
    } catch (error) {
      throw toAuthError(error);
    } finally {
      // A reCAPTCHA token is single-use; the next attempt gets a fresh widget.
      this.clearRecaptcha();
    }
  }

  async getIdToken(): Promise<string | null> {
    return (await this.auth.currentUser?.getIdToken()) ?? null;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  private createRecaptcha(): RecaptchaVerifier {
    this.clearRecaptcha();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const verifier = new RecaptchaVerifier(this.auth, container, { size: 'invisible' });
    this.recaptcha = { verifier, container };
    return verifier;
  }

  private clearRecaptcha() {
    if (!this.recaptcha) return;
    this.recaptcha.verifier.clear();
    this.recaptcha.container.remove();
    this.recaptcha = null;
  }
}

export function createFirebaseAuthService(getConfig: () => FirebaseOptions): AuthService {
  return new FirebaseAuthService(getAuth(initializeApp(getConfig())));
}
