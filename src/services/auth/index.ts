import type { AuthService } from './AuthService';
import { getFakeAuthSignedIn } from '@/config/env';

import { DEMO_USER, FakeAuthService } from './FakeAuthService';

export type { AuthService, PhoneVerification } from './AuthService';

/** Firebase Auth replaces the fake here in F6. */
export function createAuthService(): AuthService {
  return new FakeAuthService(getFakeAuthSignedIn() ? DEMO_USER : null);
}
