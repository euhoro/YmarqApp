import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

/** Who made the request, taken from a verified sign-in token. */
export interface AuthUser {
  id: string;
  phoneNumber: string | null;
}

export type TokenVerifier = (token: string) => Promise<AuthUser>;

/** Google's public keys for Firebase Auth ID tokens. */
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let remoteKeys: JWTVerifyGetKey | undefined;

/**
 * Verifies Firebase ID tokens (what the app's Firebase Auth sign-in returns): RS256 signature by Google,
 * `aud` = project id, `iss` = securetoken.google.com/<project>, not expired, non-empty `sub`.
 * Tests inject their own `keys` instead of Google's.
 */
export function createFirebaseVerifier(projectId: string, keys?: JWTVerifyGetKey): TokenVerifier {
  const getKey =
    keys ??
    (remoteKeys ??= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL), { cacheMaxAge: 3_600_000 }));

  return async (token) => {
    const { payload } = await jwtVerify(token, getKey, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('Token has no subject');
    }
    const phoneNumber = typeof payload.phone_number === 'string' ? payload.phone_number : null;
    return { id: payload.sub, phoneNumber };
  };
}

/**
 * Development tokens: `dev:<userId>` signs in as that user without Firebase. Used by local runs,
 * tests and the app's fake auth. Never allowed in production (see `createAuthConfig`).
 */
export const devVerifier: TokenVerifier = async (token) => {
  const match = /^dev:([\w:+.@-]{1,128})$/.exec(token);
  if (!match) throw new Error('Not a dev token');
  const id = match[1]!;
  return { id, phoneNumber: id.startsWith('phone:') ? id.slice('phone:'.length) : null };
};
