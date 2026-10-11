import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';
import { createTokenVerifier } from '../config.js';
import { createFirebaseVerifier, devVerifier } from '../verifier.js';

const PROJECT = 'ymarq-35862';
const ISSUER = `https://securetoken.google.com/${PROJECT}`;

let googleKey: CryptoKey;
let otherKey: CryptoKey;
let jwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const google = await generateKeyPair('RS256', { extractable: true });
  const other = await generateKeyPair('RS256', { extractable: true });
  googleKey = google.privateKey;
  otherKey = other.privateKey;
  const publicJwk: JWK = { ...(await exportJWK(google.publicKey)), kid: 'google-1', alg: 'RS256' };
  jwks = createLocalJWKSet({ keys: [publicJwk] });
});

function token({
  key = googleKey,
  audience = PROJECT,
  issuer = ISSUER,
  subject = 'firebase-uid-1',
  expiresIn = '1h',
  phone = '+972501234567',
}: {
  key?: CryptoKey;
  audience?: string;
  issuer?: string;
  subject?: string;
  expiresIn?: string | number;
  phone?: string;
} = {}) {
  return new SignJWT({ phone_number: phone })
    .setProtectedHeader({ alg: 'RS256', kid: 'google-1' })
    .setAudience(audience)
    .setIssuer(issuer)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

function app(verifyToken = createFirebaseVerifier(PROJECT, jwks)) {
  return createApp({ stores: createStores('memory'), verifyToken });
}

const whoami = (token?: string, target = app()) =>
  target.request('/v1/whoami', token ? { headers: { Authorization: `Bearer ${token}` } } : {});

describe('Firebase token verification', () => {
  it('accepts a valid token and exposes the user', async () => {
    const response = await whoami(await token());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'firebase-uid-1', phoneNumber: '+972501234567' });
  });

  it.each([
    ['no Authorization header', undefined],
    ['an empty bearer', ''],
  ])('rejects %s with 401 JSON', async (_label, value) => {
    const response = await whoami(value);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Sign in required' });
  });

  it.each([
    ['expired', () => token({ expiresIn: Math.floor(Date.now() / 1000) - 60 })],
    ['another Firebase project', () => token({ audience: 'someone-elses-project' })],
    ['the wrong issuer', () => token({ issuer: 'https://evil.example.com' })],
    ['signed by an unknown key', () => token({ key: otherKey })],
    ['not a JWT', async () => 'garbage'],
  ])('rejects a token that is %s', async (_label, make) => {
    const response = await whoami(await make());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid or expired sign-in' });
  });

  it('rejects unsigned tokens (alg: none)', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ aud: PROJECT, iss: ISSUER, sub: 'x', exp: 9999999999 }),
    ).toString('base64url');

    expect((await whoami(`${header}.${body}.`)).status).toBe(401);
  });

  it('does not protect /health', async () => {
    expect((await app().request('/health')).status).toBe(200);
  });
});

describe('dev tokens', () => {
  it('signs in as the given user id', async () => {
    const response = await whoami('dev:phone:+972501234567', app(devVerifier));

    expect(await response.json()).toEqual({
      id: 'phone:+972501234567',
      phoneNumber: '+972501234567',
    });
  });

  it('are refused in firebase mode', async () => {
    const verifier = createTokenVerifier({ AUTH_MODE: 'firebase' });
    expect((await whoami('dev:alice', app(verifier))).status).toBe(401);
  });

  it('are accepted in dev mode', async () => {
    const verifier = createTokenVerifier({ AUTH_MODE: 'dev' });
    expect((await whoami('dev:alice', app(verifier))).status).toBe(200);
  });

  it('dev mode cannot start in production', () => {
    expect(() => createTokenVerifier({ AUTH_MODE: 'dev', VERCEL_ENV: 'production' })).toThrow(
      /not allowed in production/,
    );
    expect(() => createTokenVerifier({ AUTH_MODE: 'magic' })).toThrow(/Unknown AUTH_MODE/);
  });
});
