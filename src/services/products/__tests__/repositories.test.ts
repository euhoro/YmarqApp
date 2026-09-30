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
      { id: '1', description: 'Bike', hashtag: '#bike', imageUrl: null, publisherId: null },
    ]);
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

  it('fails clearly for the not-yet-implemented Firestore source', () => {
    expect(() => createProductRepository('firestore')).toThrow(/F2c/);
  });
});
