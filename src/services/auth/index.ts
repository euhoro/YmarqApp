import type { AuthService } from './AuthService';
import { FakeAuthService } from './FakeAuthService';

export type { AuthService, PhoneVerification } from './AuthService';

/** Firebase Auth replaces the fake here in F6. */
export function createAuthService(): AuthService {
  return new FakeAuthService();
}
