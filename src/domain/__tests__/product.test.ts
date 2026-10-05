import { formatPrice, parseLegacyProducts } from '../product';

describe('parseLegacyProducts', () => {
  it('maps the legacy payload to products', () => {
    // Verbatim sample from the 2014 app (ProductsListFragment.getProductMock).
    const legacy = JSON.parse(
      '[{"Description":"Suzuki Swift","Hashtag":"Nice car","Id":"e7b6646b-4718-4abf-8260-73188d395c30","Image":"","PublisherId":""}]',
    );

    expect(parseLegacyProducts(legacy)).toEqual([
      {
        id: 'e7b6646b-4718-4abf-8260-73188d395c30',
        description: 'Suzuki Swift',
        hashtag: 'Nice car',
        imageUrl: null,
        publisherId: null,
        price: null,
        currency: null,
        category: null,
        location: null,
      },
    ]);
  });

  it('keeps image and publisher when present, and tolerates missing optional fields', () => {
    const products = parseLegacyProducts([
      {
        Id: '1',
        Description: 'Bike',
        Hashtag: '#bike',
        Image: 'https://x/1.jpg',
        PublisherId: 'u1',
      },
      { Id: '2', Description: 'Table', Hashtag: '#home' },
    ]);

    expect(products[0]).toMatchObject({ imageUrl: 'https://x/1.jpg', publisherId: 'u1' });
    expect(products[1]).toMatchObject({ imageUrl: null, publisherId: null });
  });

  it('reads the optional price, currency, category and location', () => {
    const [product] = parseLegacyProducts([
      {
        Id: '3',
        Description: 'Suzuki Swift',
        Hashtag: '',
        Price: 25000,
        Currency: 'ILS',
        Category: 'Vehicles',
        Location: 'Tel Aviv',
      },
    ]);

    expect(product).toMatchObject({
      price: 25000,
      currency: 'ILS',
      category: 'Vehicles',
      location: 'Tel Aviv',
    });
    expect(formatPrice(product)).toBe('₪25,000');
    expect(formatPrice({ price: null, currency: null })).toBeNull();
  });

  it('rejects malformed data', () => {
    expect(() => parseLegacyProducts([{ Id: 1 }])).toThrow();
    expect(() => parseLegacyProducts({ not: 'an array' })).toThrow();
  });
});
