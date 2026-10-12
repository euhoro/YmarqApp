import { describe, expect, it } from 'vitest';

import { devVerifier } from '../../auth/verifier.js';
import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';

function setup() {
  const app = createApp({ stores: createStores('memory'), verifyToken: devVerifier });
  const as = (user: string) => {
    const headers = { Authorization: `Bearer dev:${user}`, 'Content-Type': 'application/json' };
    return {
      get: (path: string) => app.request(path, { headers }),
      put: (path: string, body: unknown) =>
        app.request(path, { method: 'PUT', headers, body: JSON.stringify(body) }),
    };
  };
  return { app, dana: as('phone:+972501234567'), avi: as('avi') };
}

describe('/v1/me', () => {
  it('requires sign-in', async () => {
    const { app } = setup();
    expect((await app.request('/v1/me')).status).toBe(401);
    expect((await app.request('/v1/users/avi')).status).toBe(401);
  });

  it('returns 404 until the user has registered a name', async () => {
    const { dana } = setup();
    const response = await dana.get('/v1/me');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Profile not found' });
  });

  it('saves the display name with the phone number from the sign-in token', async () => {
    const { dana } = setup();

    const saved = await dana.put('/v1/me', { displayName: '  Dana  ' });

    expect(saved.status).toBe(200);
    const profile = await saved.json();
    expect(profile).toMatchObject({
      id: 'phone:+972501234567',
      displayName: 'Dana',
      phoneNumber: '+972501234567',
    });
    expect(await (await dana.get('/v1/me')).json()).toEqual(profile);
  });

  it('updates the display name', async () => {
    const { dana } = setup();
    await dana.put('/v1/me', { displayName: 'Dana' });
    await dana.put('/v1/me', { displayName: 'Dana K' });

    expect((await (await dana.get('/v1/me')).json()).displayName).toBe('Dana K');
  });

  it('ignores an id sent by the client', async () => {
    const { dana, avi } = setup();
    await avi.put('/v1/me', { displayName: 'Avi', id: 'phone:+972501234567' });

    expect((await dana.get('/v1/me')).status).toBe(404);
  });

  it('validates the display name (2–40 characters)', async () => {
    const { dana } = setup();

    const tooShort = await dana.put('/v1/me', { displayName: ' D ' });
    expect(tooShort.status).toBe(400);
    expect((await tooShort.json()).error).toBe('Invalid profile');
    expect((await dana.put('/v1/me', { displayName: 'x'.repeat(41) })).status).toBe(400);
    expect((await dana.put('/v1/me', {})).status).toBe(400);
    expect((await dana.put('/v1/me', 'not json')).status).toBe(400);
  });
});

describe('/v1/users/{id}', () => {
  it("shows another user's public profile without their phone number", async () => {
    const { dana, avi } = setup();
    await dana.put('/v1/me', { displayName: 'Dana' });

    const response = await avi.get('/v1/users/phone:+972501234567');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 'phone:+972501234567', displayName: 'Dana' });
  });

  it('returns 404 for unknown users', async () => {
    const { avi } = setup();
    const response = await avi.get('/v1/users/nobody');

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'User not found' });
  });
});
