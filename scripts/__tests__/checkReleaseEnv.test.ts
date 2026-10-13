import { spawnSync } from 'node:child_process';
import path from 'node:path';

const SCRIPT = path.join(__dirname, '..', 'check-release-env.mjs');

const REAL = {
  EXPO_PUBLIC_DATA_SOURCE: 'api',
  EXPO_PUBLIC_API_URL: 'https://ymarq-app-api.vercel.app',
  EXPO_PUBLIC_AUTH: 'firebase',
  EXPO_PUBLIC_FIREBASE_API_KEY: 'key',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'ymarq-35862.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'ymarq-35862',
  EXPO_PUBLIC_FIREBASE_APP_ID: 'app',
};

/** Runs the check with only `env` set (plus PATH), like a fresh CI machine. */
type Env = Record<string, string>;

function check(env: Env) {
  const result = spawnSync(process.execPath, [SCRIPT], {
    // Cast: Expo's types make NODE_ENV required, but a fresh environment doesn't have it.
    env: { PATH: process.env.PATH ?? '', ...env } as unknown as NodeJS.ProcessEnv,
    encoding: 'utf8',
  });
  return { status: result.status, output: result.stdout + result.stderr };
}

describe('check-release-env', () => {
  it('lets non-release builds through, whatever they use', () => {
    expect(check({}).status).toBe(0);
    expect(check({ VERCEL_ENV: 'preview', EXPO_PUBLIC_DATA_SOURCE: 'fake' }).status).toBe(0);
    expect(check({ EAS_BUILD_PROFILE: 'development' }).status).toBe(0);
  });

  it.each<Env>([{ VERCEL_ENV: 'production' }, { EAS_BUILD_PROFILE: 'production' }])(
    'refuses a release build with fake data or fake sign-in (%o)',
    (release) => {
      const result = check({ ...release, EXPO_PUBLIC_DATA_SOURCE: 'fake' });

      expect(result.status).toBe(1);
      expect(result.output).toContain('EXPO_PUBLIC_DATA_SOURCE must be "api"');
      expect(result.output).toContain('EXPO_PUBLIC_AUTH must be "firebase"');
      expect(result.output).toContain('EXPO_PUBLIC_FIREBASE_API_KEY is missing');
    },
  );

  it('accepts a release build with the real API and Firebase', () => {
    expect(check({ VERCEL_ENV: 'production', ...REAL }).status).toBe(0);
    expect(
      check({ VERCEL_ENV: 'production', ...REAL, EXPO_PUBLIC_API_URL: 'http://localhost:3001' })
        .status,
    ).toBe(1);
  });
});
