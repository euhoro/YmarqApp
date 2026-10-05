import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import FeedScreen from '@/app/(app)/index';
import NewListingRoute from '@/app/(app)/new-listing';
import { AppProviders } from '@/providers/AppProviders';
import { FakeAuthService } from '@/services/auth/FakeAuthService';
import type { ProductRepository } from '@/services/products';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';

const PHOTO = 'file:///photo.jpg';

function renderSell(products: ProductRepository = new FakeProductRepository()) {
  const app = renderRouter(
    { index: FeedScreen, 'new-listing': NewListingRoute },
    {
      initialUrl: `/new-listing?photoUri=${encodeURIComponent(PHOTO)}`,
      wrapper: ({ children }) => (
        <AppProviders services={{ auth: new FakeAuthService(), products }}>{children}</AppProviders>
      ),
    },
  );
  return { app, products };
}

const describe_ = (text: string) =>
  fireEvent.changeText(screen.getByLabelText('What are you selling?'), text);

describe('NewListingScreen (sell)', () => {
  it('needs a description before publishing', async () => {
    const { app } = renderSell();
    await app;

    expect(screen.getByTestId('new-listing-photo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();

    await describe_('Sofa');
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  it('suggests price, location and hashtags from the description', async () => {
    const { app } = renderSell();
    await app;

    await describe_('Selling my Suzuki Swift 2012, 25,000 ₪, Tel Aviv #car');

    expect(screen.getByLabelText('Price').props.value).toBe('25000');
    expect(screen.getByLabelText('Location').props.value).toBe('Tel Aviv');
    expect(screen.getByLabelText('Hashtags').props.value).toBe('#car');
    expect(screen.getByText(/Filled in from your description/)).toBeTruthy();
  });

  it('keeps what the user typed when the description changes again', async () => {
    const { app } = renderSell();
    await app;

    await describe_('Sofa, 900 ₪, Haifa');
    await fireEvent.changeText(screen.getByLabelText('Location'), 'Kiryat Haim');
    await describe_('Sofa, 800 ₪, Haifa');

    expect(screen.getByLabelText('Location').props.value).toBe('Kiryat Haim');
    expect(screen.getByLabelText('Price').props.value).toBe('800');
  });

  it('publishes and shows the new listing first in the feed', async () => {
    const products = new FakeProductRepository();
    const { app } = renderSell(products);
    await app;

    await describe_('Selling my Suzuki Swift 2012, 25,000 ₪, Tel Aviv');
    await fireEvent.press(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(app.getPathname()).toBe('/'));
    const [first] = await products.listProducts('any');
    expect(first).toMatchObject({
      description: 'Selling my Suzuki Swift 2012, 25,000 ₪, Tel Aviv',
      price: 25000,
      currency: 'ILS',
      category: 'Vehicles',
      location: 'Tel Aviv',
      imageUrl: PHOTO,
      publisherId: '1111111111',
    });
    expect(
      await screen.findByText('Selling my Suzuki Swift 2012, 25,000 ₪, Tel Aviv'),
    ).toBeTruthy();
  });

  it('shows an error when publishing fails', async () => {
    const failing = new FakeProductRepository();
    failing.createProduct = jest.fn().mockRejectedValue(new Error('offline'));
    const { app } = renderSell(failing);
    await app;

    await describe_('Lamp');
    await fireEvent.press(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByText(/Couldn't publish/)).toBeTruthy();
    expect(app.getPathname()).toBe('/new-listing');
  });
});
