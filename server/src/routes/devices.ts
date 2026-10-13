import { Expo } from 'expo-server-sdk';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '../env.js';

const NewDeviceSchema = z.object({
  token: z.string().refine((token) => Expo.isExpoPushToken(token), 'Not an Expo push token'),
});

/**
 * `/v1/devices`: the caller's phones that get push notifications. The app registers its Expo push
 * token after sign-in and deletes it on sign-out.
 */
export const deviceRoutes = new Hono<AppEnv>()
  .post('/', async (c) => {
    const parsed = NewDeviceSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: 'Invalid device', issues: parsed.error.issues }, 400);
    }
    const device = await c.get('stores').devices.register(c.get('user').id, parsed.data.token);
    return c.json({ token: device.token, userId: device.userId }, 201);
  })
  .delete('/:token', async (c) => {
    // Idempotent: signing out twice, or after Expo dropped the token, is not an error.
    await c.get('stores').devices.unregister(c.get('user').id, c.req.param('token'));
    return c.body(null, 204);
  });
