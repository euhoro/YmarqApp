/**
 * Runtime configuration. Expo inlines `EXPO_PUBLIC_*` variables at build time,
 * so they must be read with static `process.env.EXPO_PUBLIC_…` access.
 * See `.env.example`.
 */

export const DATA_SOURCES = ['fake', 'firestore', 'legacy'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

export function getDataSource(value = process.env.EXPO_PUBLIC_DATA_SOURCE): DataSource {
  if (!value) return 'fake';
  if ((DATA_SOURCES as readonly string[]).includes(value)) return value as DataSource;
  throw new Error(
    `Unknown EXPO_PUBLIC_DATA_SOURCE "${value}". Expected one of: ${DATA_SOURCES.join(', ')}.`,
  );
}

export function getLegacyApiUrl(value = process.env.EXPO_PUBLIC_LEGACY_API_URL): string {
  if (!value) {
    throw new Error('EXPO_PUBLIC_LEGACY_API_URL must be set when EXPO_PUBLIC_DATA_SOURCE=legacy.');
  }
  return value.replace(/\/+$/, '');
}

/** Fake auth starts signed in (handy for working on other screens) unless set to `false`. */
export function getFakeAuthSignedIn(value = process.env.EXPO_PUBLIC_FAKE_AUTH_SIGNED_IN): boolean {
  return value !== 'false';
}
