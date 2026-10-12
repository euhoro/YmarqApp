/**
 * Runtime configuration. Expo inlines `EXPO_PUBLIC_*` variables at build time,
 * so they must be read with static `process.env.EXPO_PUBLIC_…` access.
 * See `.env.example`.
 */

export const DATA_SOURCES = ['fake', 'api', 'legacy'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

export function getDataSource(value = process.env.EXPO_PUBLIC_DATA_SOURCE): DataSource {
  if (!value) return 'fake';
  if ((DATA_SOURCES as readonly string[]).includes(value)) return value as DataSource;
  throw new Error(
    `Unknown EXPO_PUBLIC_DATA_SOURCE "${value}". Expected one of: ${DATA_SOURCES.join(', ')}.`,
  );
}

export function getApiUrl(value = process.env.EXPO_PUBLIC_API_URL): string {
  if (!value) {
    throw new Error('EXPO_PUBLIC_API_URL must be set when EXPO_PUBLIC_DATA_SOURCE=api.');
  }
  return value.replace(/\/+$/, '');
}

export function getLegacyApiUrl(value = process.env.EXPO_PUBLIC_LEGACY_API_URL): string {
  if (!value) {
    throw new Error('EXPO_PUBLIC_LEGACY_API_URL must be set when EXPO_PUBLIC_DATA_SOURCE=legacy.');
  }
  return value.replace(/\/+$/, '');
}

export const AUTH_MODES = ['fake', 'firebase'] as const;
export type AuthMode = (typeof AUTH_MODES)[number];

export function getAuthMode(value = process.env.EXPO_PUBLIC_AUTH): AuthMode {
  if (!value) return 'fake';
  if ((AUTH_MODES as readonly string[]).includes(value)) return value as AuthMode;
  throw new Error(
    `Unknown EXPO_PUBLIC_AUTH "${value}". Expected one of: ${AUTH_MODES.join(', ')}.`,
  );
}

/** Firebase web app config (public identifiers, not secrets). Needed when EXPO_PUBLIC_AUTH=firebase. */
export function getFirebaseConfig(
  env: Record<string, string | undefined> = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
) {
  const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = env;
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      'EXPO_PUBLIC_AUTH=firebase needs EXPO_PUBLIC_FIREBASE_API_KEY, _AUTH_DOMAIN, _PROJECT_ID and _APP_ID.',
    );
  }
  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

/** Fake auth starts signed in (handy for working on other screens) unless set to `false`. */
export function getFakeAuthSignedIn(value = process.env.EXPO_PUBLIC_FAKE_AUTH_SIGNED_IN): boolean {
  return value !== 'false';
}
