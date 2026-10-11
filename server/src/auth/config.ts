import { createFirebaseVerifier, devVerifier, type TokenVerifier } from './verifier.js';

export const DEFAULT_FIREBASE_PROJECT_ID = 'ymarq-35862';

export interface AuthEnv {
  AUTH_MODE?: string;
  FIREBASE_PROJECT_ID?: string;
  VERCEL_ENV?: string;
}

/**
 * Chooses how tokens are verified from the environment:
 * - `AUTH_MODE=firebase` (default): real Firebase ID tokens only.
 * - `AUTH_MODE=dev`: Firebase tokens *or* `dev:<userId>`. Refused when `VERCEL_ENV=production`.
 */
export function createTokenVerifier(env: AuthEnv = process.env): TokenVerifier {
  const mode = env.AUTH_MODE ?? 'firebase';
  const firebase = createFirebaseVerifier(env.FIREBASE_PROJECT_ID ?? DEFAULT_FIREBASE_PROJECT_ID);
  if (mode === 'firebase') return firebase;
  if (mode === 'dev') {
    if (env.VERCEL_ENV === 'production') {
      throw new Error('AUTH_MODE=dev is not allowed in production.');
    }
    return async (token) => (token.startsWith('dev:') ? devVerifier(token) : firebase(token));
  }
  throw new Error(`Unknown AUTH_MODE=${mode}. Use firebase or dev.`);
}
