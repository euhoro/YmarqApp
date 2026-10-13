import { describe, expect, it } from 'vitest';

import { devVerifier } from '../../auth/verifier.js';
import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';

const PHONE = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';

function setup() {
  const stores = createStores('memory');
  const app = createApp({ stores, verifyToken: devVerifier });
  const as = (user: string) => {
    const headers = { Authorization: `Bearer dev:${user}`, 'Content-Type': 'application/json' };
    return {
      post: (path: string, body: unknown) =>
        app.request(path, { method: 'POST', headers, body: JSON.stringify(body) }),
      delete: (path: string) => app.request(path, { method: 'DELETE', headers }),
    };
  };
  return { app, stores, avi: as('avi'), eve: as('eve') };
}

describe('/v1/devices', () => {
  it('requires sign-in', async () => {
    const { app } = setup();
    expect((await app.request('/v1/devices', { method: 'POST' })).status).toBe(401);
    expect((await app.request(`/v1/devices/x`, { method: 'DELETE' })).status).toBe(401);
  });

  it('registers an Expo push token for the caller', async () => {
    const { avi, stores } = setup();

    const response = await avi.post('/v1/devices', { token: PHONE });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ token: PHONE, userId: 'avi' });
    expect(await stores.devices.listForUsers(['avi'])).toHaveLength(1);
  });

  it('rejects anything that is not an Expo push token', async () => {
    const { avi } = setup();

    for (const body of [{ token: 'abc' }, {}, null]) {
      const response = await avi.post('/v1/devices', body);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: 'Invalid device' });
    }
  });

  it("deletes the caller's token on sign-out, and never someone else's", async () => {
    const { avi, eve, stores } = setup();
    await avi.post('/v1/devices', { token: PHONE });
    const path = `/v1/devices/${encodeURIComponent(PHONE)}`;

    expect((await eve.delete(path)).status).toBe(204);
    expect(await stores.devices.listForUsers(['avi'])).toHaveLength(1);

    expect((await avi.delete(path)).status).toBe(204);
    expect(await stores.devices.listForUsers(['avi'])).toEqual([]);
    expect((await avi.delete(path)).status).toBe(204);
  });
});
