import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import type { AppEnv } from '../env.js';
import type { SavedSearch } from '../stores/SavedSearchStore.js';

const NewSavedSearchSchema = z.object({ query: z.string().trim().min(1).max(100) });

/** JSON shape of a saved search; matches the app's `SavedSearch`. */
const toJson = (savedSearch: SavedSearch) => ({
  id: savedSearch.id,
  userId: savedSearch.userId,
  query: savedSearch.query,
  createdAt: savedSearch.createdAt.toISOString(),
});

/**
 * `/v1/saved-searches`: the caller's saved searches ("alerts"). New listings that match one are
 * announced as `listing.matched` (see `matching/`).
 */
export const savedSearchRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const found = await c.get('stores').savedSearches.list(c.get('user').id);
    return c.json(found.map(toJson));
  })
  .post('/', async (c) => {
    const parsed = NewSavedSearchSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: 'Invalid saved search', issues: parsed.error.issues }, 400);
    }
    const { savedSearch, created } = await c
      .get('stores')
      .savedSearches.save(c.get('user').id, parsed.data.query);
    return c.json(toJson(savedSearch), created ? 201 : 200);
  })
  .delete('/:id', async (c) => {
    const deleted = await c.get('stores').savedSearches.delete(c.get('user').id, c.req.param('id'));
    if (!deleted) throw new HTTPException(404, { message: 'Saved search not found' });
    return c.body(null, 204);
  });
