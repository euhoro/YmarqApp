import { Hono } from 'hono';

import { toLegacyProduct } from '../domain/product.js';
import type { AppEnv } from '../env.js';

/**
 * The 2014 contract, `GET /photos/GetProducts/{userCode}`, returning PascalCase products, so the app's
 * legacy data source works against this API unchanged. Returns every listing (visibility rules come
 * with contacts linking, #21); the user code is accepted for compatibility.
 */
export const legacyRoutes = new Hono<AppEnv>().get('/GetProducts/:userCode', async (c) => {
  const products = await c.get('stores').products.list();
  return c.json(products.map(toLegacyProduct));
});
