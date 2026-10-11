import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { NewProductSchema, type Product } from '../domain/product.js';
import type { AppEnv } from '../env.js';

/** JSON shape of a product (dates as ISO strings). */
const toJson = (product: Product) => ({ ...product, createdAt: product.createdAt.toISOString() });

/** `/v1/products`: list/search, get, create (you are the publisher), delete (only your own). */
export const productRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const { products } = c.get('stores');
    const query = c.req.query('q');
    const found = query ? await products.search(query) : await products.list();
    return c.json(found.map(toJson));
  })
  .get('/:id', async (c) => {
    const product = await c.get('stores').products.get(c.req.param('id'));
    if (!product) throw new HTTPException(404, { message: 'Listing not found' });
    return c.json(toJson(product));
  })
  .post('/', async (c) => {
    const parsed = NewProductSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: 'Invalid listing', issues: parsed.error.issues }, 400);
    }
    const created = await c
      .get('stores')
      .products.create({ ...parsed.data, publisherId: c.get('user').id });
    return c.json(toJson(created), 201);
  })
  .delete('/:id', async (c) => {
    const { products } = c.get('stores');
    const product = await products.get(c.req.param('id'));
    if (!product) throw new HTTPException(404, { message: 'Listing not found' });
    if (product.publisherId !== c.get('user').id) {
      throw new HTTPException(403, { message: 'Only the seller can delete this listing' });
    }
    await products.delete(product.id);
    return c.body(null, 204);
  });
