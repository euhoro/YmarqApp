import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { ProfileInputSchema, type Profile } from '../domain/profile.js';
import type { AppEnv } from '../env.js';

/** JSON shape of your own profile (dates as ISO strings). */
const toJson = (profile: Profile) => ({
  ...profile,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});

/** `/v1/me`: read and save your own profile. 404 means "not registered yet". */
export const meRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const profile = await c.get('stores').profiles.get(c.get('user').id);
    if (!profile) throw new HTTPException(404, { message: 'Profile not found' });
    return c.json(toJson(profile));
  })
  .put('/', async (c) => {
    const parsed = ProfileInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: 'Invalid profile', issues: parsed.error.issues }, 400);
    }
    const { id, phoneNumber } = c.get('user');
    const saved = await c.get('stores').profiles.save({ ...parsed.data, id, phoneNumber });
    return c.json(toJson(saved));
  });

/** `/v1/users/{id}`: another user's public profile (id + display name only). */
export const userRoutes = new Hono<AppEnv>().get('/:id', async (c) => {
  const profile = await c.get('stores').profiles.get(c.req.param('id'));
  if (!profile) throw new HTTPException(404, { message: 'User not found' });
  return c.json({ id: profile.id, displayName: profile.displayName });
});
