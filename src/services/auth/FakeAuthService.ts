import type { AuthUser } from '@/domain/user';

import type { AuthService, PhoneVerification } from './AuthService';

/** The user code the legacy app hardcoded for its feed. */
export const DEMO_USER: AuthUser = { id: '1111111111', phoneNumber: null, email: null };

/** The code that confirms any fake phone sign-in (matches the Firebase test-number convention). */
export const FAKE_SMS_CODE = '123456';

export class FakeAuthService implements AuthService {
  readonly demoHint = `Demo mode: any mobile number works; the code is ${FAKE_SMS_CODE}.`;
  private listeners = new Set<(user: AuthUser | null) => void>();

  constructor(private user: AuthUser | null = DEMO_USER) {}

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
    return {
      confirm: async (code: string) => {
        if (code !== FAKE_SMS_CODE) throw new Error('Invalid verification code.');
        this.setUser({ id: `phone:${phoneNumber}`, phoneNumber, email: null });
        return this.user!;
      },
    };
  }

  async signOut(): Promise<void> {
    this.setUser(null);
  }

  private setUser(user: AuthUser | null) {
    this.user = user;
    this.listeners.forEach((listener) => listener(user));
  }
}
