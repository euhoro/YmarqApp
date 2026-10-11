import { ApiError, ApiProductRepository } from '../ApiProductRepository';

const BASE = 'https://ymarq-app-api.vercel.app';
const API_PRODUCT = {
  id: '6b1f0c2e-0000-4000-8000-000000000001',
  publisherId: 'dana',
  description: 'Sofa, almost new',
  hashtag: '#home',
  imageUrl: null,
  price: 900,
  currency: 'ILS',
  category: 'Furniture',
  location: 'Haifa',
  createdAt: '2026-10-11T10:00:00.000Z',
};

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  } as Response;
}

function setup(...responses: Response[]) {
  const fetchFn = jest.fn();
  responses.forEach((r) => fetchFn.mockResolvedValueOnce(r));
  const repo = new ApiProductRepository(BASE, async () => 'dev:dana', fetchFn);
  return { repo, fetchFn };
}

describe('ApiProductRepository', () => {
  it('lists products with the bearer token', async () => {
    const { repo, fetchFn } = setup(response([API_PRODUCT]));

    const products = await repo.listProducts();

    expect(products[0]).toMatchObject({ id: API_PRODUCT.id, price: 900, location: 'Haifa' });
    expect(fetchFn).toHaveBeenCalledWith(`${BASE}/v1/products`, {
      method: 'GET',
      headers: { Authorization: 'Bearer dev:dana' },
      body: undefined,
    });
  });

  it('searches with an encoded ?q=', async () => {
    const { repo, fetchFn } = setup(response([]));

    await repo.searchProducts('  tel aviv & more ');

    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/v1/products?q=tel%20aviv%20%26%20more`);
  });

  it('returns null for a 404 and throws other errors with the server message', async () => {
    const { repo } = setup(
      response({ error: 'Listing not found' }, 404),
      response({ error: 'Invalid or expired sign-in' }, 401),
    );

    expect(await repo.getProduct('missing')).toBeNull();
    await expect(repo.getProduct('x')).rejects.toEqual(
      new ApiError(401, 'Invalid or expired sign-in'),
    );
  });

  it('creates listings without sending publisherId (the server uses the token)', async () => {
    const { repo, fetchFn } = setup(response(API_PRODUCT, 201));

    const created = await repo.createProduct({
      description: 'Sofa, almost new',
      hashtag: '#home',
      imageUrl: null,
      publisherId: 'spoofed',
      price: 900,
      currency: 'ILS',
      category: 'Furniture',
      location: 'Haifa',
    });

    expect(created.publisherId).toBe('dana');
    const [, init] = fetchFn.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).not.toHaveProperty('publisherId');
  });

  it('rejects malformed server data', async () => {
    const { repo } = setup(response([{ id: 1 }]));

    await expect(repo.listProducts()).rejects.toThrow();
  });
});

describe('default fetch', () => {
  it('calls the global fetch unbound (browsers reject fetch called as a method)', async () => {
    const original = globalThis.fetch;
    const calls: unknown[] = [];
    globalThis.fetch = function (this: unknown, ...args: Parameters<typeof fetch>) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      calls.push(args[0]);
      return Promise.resolve(response([]));
    } as typeof fetch;
    try {
      await new ApiProductRepository(BASE, async () => null).listProducts();
      expect(calls).toEqual([`${BASE}/v1/products`]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
