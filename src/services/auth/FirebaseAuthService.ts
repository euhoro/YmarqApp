import type { FirebaseOptions } from 'firebase/app';

import type { AuthService } from './AuthService';

/** Native phone sign-in needs the native Firebase SDK and a development build (F6b, #13). */
export function createFirebaseAuthService(_config: FirebaseOptions): AuthService {
  throw new Error(
    'EXPO_PUBLIC_AUTH=firebase is only supported on web for now (native sign-in is #13).',
  );
}
