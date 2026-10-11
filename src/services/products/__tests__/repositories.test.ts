import { createProductRepository } from '..';
import { FakeProductRepository } from '../FakeProductRepository';
import { LegacyApiProductRepository } from '../LegacyApiProductRepository';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('FakeProductRepository', () => {
  it('returns the sample products, starting with the legacy mock', async () => {
    const products = await new FakeProductRepository().listProducts('1111111111');

    expect(products.length).toBeGreaterThan(0);
    expect(products[0].description).toBe('Suzuki Swift');
  });
});

describe('FakeProductRepository search, get and create', () => {
  it('searches case-insensitively across description, hashtag, category and location', async () => {
    const repo = new FakeProductRepository();
    const created = await repo.createProduct({
      description: 'Sofa, almost new',
      hashtag: '#home',
      imageUrl: null,
      publisherId: 'u1',
      price: 900,
      currency: 'ILS',
      category: 'Furniture',
      location: 'Haifa',
    });

    expect((await repo.searchProducts('SWIFT')).map((p) => p.description)).toEqual([
      'Suzuki Swift',
    ]);
    expect((await repo.searchProducts('haifa')).map((p) => p.id)).toEqual([created.id]);
    expect((await repo.searchProducts('furniture')).map((p) => p.id)).toContain(created.id);
    expect(await repo.searchProducts('no-such-thing')).toEqual([]);
  });

  it('puts new listings first and finds them by id', async () => {
    const repo = new FakeProductRepository();
    const created = await repo.createProduct({
      description: 'Lamp',
      hashtag: '',
      imageUrl: null,
      publisherId: 'u1',
      price: null,
      currency: null,
      category: null,
      location: null,
    });

    expect((await repo.listProducts('u1'))[0].id).toBe(created.id);
    expect(await repo.getProduct(created.id)).toEqual(created);
    expect(await repo.getProduct('missing')).toBeNull();
  });
});

describe('LegacyApiProductRepository', () => {
  it('calls the legacy GetProducts endpoint and parses the payload', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue(
        jsonResponse([
          { Id: '1', Description: 'Bike', Hashtag: '#bike', Image: '', PublisherId: '' },
        ]),
      );
    const repo = new LegacyApiProductRepository('https://legacy.example.com', fetchFn);

    const products = await repo.listProducts('1111111111');

    expect(fetchFn).toHaveBeenCalledWith(
      'https://legacy.example.com/photos/GetProducts/1111111111',
    );
    expect(products).toEqual([
      {
        id: '1',
        description: 'Bike',
        hashtag: '#bike',
        imageUrl: null,
        publisherId: null,
        price: null,
        currency: null,
        category: null,
        location: null,
      },
    ]);
  });

  it('sends the bearer token when signed in', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse([]));
    const repo = new LegacyApiProductRepository(
      'https://legacy.example.com',
      fetchFn,
      async () => 'dev:1111111111',
    );

    await repo.listProducts('1111111111');

    expect(fetchFn).toHaveBeenCalledWith(
      'https://legacy.example.com/photos/GetProducts/1111111111',
      { headers: { Authorization: 'Bearer dev:1111111111' } },
    );
  });

  it('throws on HTTP errors', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(null, 500));
    const repo = new LegacyApiProductRepository('https://legacy.example.com', fetchFn);

    await expect(repo.listProducts('1')).rejects.toThrow(/HTTP 500/);
  });
});

describe('createProductRepository', () => {
  it('builds the fake repository', () => {
    expect(createProductRepository('fake')).toBeInstanceOf(FakeProductRepository);
  });

  it('needs EXPO_PUBLIC_API_URL for the api source', () => {
    expect(() => createProductRepository('api')).toThrow(/EXPO_PUBLIC_API_URL/);
  });
});
