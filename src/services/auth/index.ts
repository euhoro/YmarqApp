import type { AuthService } from './AuthService';
import { getAuthMode, getFakeAuthSignedIn, getFirebaseConfig } from '@/config/env';

import { DEMO_USER, FakeAuthService } from './FakeAuthService';
import { createFirebaseAuthService } from './FirebaseAuthService';

export { AuthError } from './AuthService';
export type { AuthService, PhoneVerification } from './AuthService';

/** `EXPO_PUBLIC_AUTH`: fake (default, demo code 123456) or firebase (real SMS; web only for now). */
export function createAuthService(): AuthService {
  if (getAuthMode() === 'firebase') return createFirebaseAuthService(getFirebaseConfig());
  return new FakeAuthService(getFakeAuthSignedIn() ? DEMO_USER : null);
}
