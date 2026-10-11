import { QueryClient } from '@tanstack/react-query';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import FeedScreen from '@/app/(app)/index';
import ListingRoute from '@/app/(app)/listing/[id]';
import { AppProviders } from '@/providers/AppProviders';
import { DEMO_USER, FakeAuthService } from '@/services/auth/FakeAuthService';
import type { ProductRepository } from '@/services/products';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';

const MACBOOK_ID = '3c9f1e52-8a41-4f0b-9d2e-6b7a1c5d8e01';

function renderApp(initialUrl = '/', products: ProductRepository = new FakeProductRepository()) {
  return renderRouter(
    { index: FeedScreen, 'listing/[id]': ListingRoute },
    {
      initialUrl,
      wrapper: ({ children }) => (
        <AppProviders
          services={{ auth: new FakeAuthService(), products }}
          queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          {children}
        </AppProviders>
      ),
    },
  );
}

describe('listing details', () => {
  it('opens from a feed card', async () => {
    const app = renderApp();
    await app;

    await fireEvent.press(await screen.findByTestId(`product-card-${MACBOOK_ID}`));

    await waitFor(() => expect(app.getPathname()).toBe(`/listing/${MACBOOK_ID}`));
    expect(await screen.findByText('MacBook Air 13", like new')).toBeTruthy();
  });

  it("shows price, category, location and the seller's name", async () => {
    const products = new FakeProductRepository();
    const created = await products.createProduct({
      description: 'Sofa, almost new',
      hashtag: '#home',
      imageUrl: null,
      publisherId: 'demo-dana',
      price: 900,
      currency: 'ILS',
      category: 'Furniture',
      location: 'Haifa',
    });
    const app = renderApp(`/listing/${created.id}`, products);
    await app;

    expect(await screen.findByText('Sofa, almost new')).toBeTruthy();
    expect(screen.getByText('₪900')).toBeTruthy();
    expect(screen.getByText('Furniture')).toBeTruthy();
    expect(screen.getByText('Haifa')).toBeTruthy();
    expect(await screen.findByText('Dana')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Message Dana/ })).toBeTruthy();
  });

  it('hides "Message seller" on your own listing', async () => {
    const products = new FakeProductRepository();
    const mine = await products.createProduct({
      description: 'My lamp',
      hashtag: '',
      imageUrl: null,
      publisherId: DEMO_USER.id,
      price: null,
      currency: null,
      category: null,
      location: null,
    });
    const app = renderApp(`/listing/${mine.id}`, products);
    await app;

    expect(await screen.findByText('Your listing')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Message/ })).toBeNull();
  });

  it('explains when a listing no longer exists', async () => {
    const app = renderApp('/listing/does-not-exist');
    await app;

    expect(await screen.findByText("This listing isn't available anymore")).toBeTruthy();
  });

  it('shows an error when loading fails', async () => {
    const products = new FakeProductRepository();
    products.getProduct = jest.fn().mockRejectedValue(new Error('offline'));
    const app = renderApp(`/listing/${MACBOOK_ID}`, products);
    await app;

    expect(await screen.findByText("Couldn't load this listing")).toBeTruthy();
  });
});
