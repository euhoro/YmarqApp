import type { AuthService } from './AuthService';
import { getAuthMode, getFakeAuthSignedIn, getFirebaseConfig } from '@/config/env';

import { DEMO_USER, FakeAuthService } from './FakeAuthService';
import { createFirebaseAuthService } from './FirebaseAuthService';

export { AuthError } from './AuthService';
export type { AuthService, PhoneVerification } from './AuthService';

/** `EXPO_PUBLIC_AUTH`: fake (default, demo code 123456) or firebase (real SMS: JS SDK on web, native SDK on iOS/Android). */
export function createAuthService(): AuthService {
  // The web config is read lazily: iOS/Android don't need it (they bundle their own Firebase files).
  if (getAuthMode() === 'firebase') return createFirebaseAuthService(() => getFirebaseConfig());
  return new FakeAuthService(getFakeAuthSignedIn() ? DEMO_USER : null);
}
