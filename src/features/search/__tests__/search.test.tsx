import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import FeedScreen from '@/app/(app)/index';
import { AppProviders } from '@/providers/AppProviders';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';

function renderFeed(products = new FakeProductRepository()) {
  return renderRouter(
    { index: FeedScreen },
    { wrapper: ({ children }) => <AppProviders services={{ products }}>{children}</AppProviders> },
  );
}

const search = (text: string) =>
  fireEvent.changeText(screen.getByLabelText('Search listings'), text);

describe('search on the feed', () => {
  it('filters listings as you type (case-insensitive substring)', async () => {
    const app = renderFeed();
    await app;
    expect(await screen.findByText('MacBook Air 13", like new')).toBeTruthy();

    await search('SWIFT');

    await waitFor(() => expect(screen.queryByText('MacBook Air 13", like new')).toBeNull());
    expect(await screen.findByText('Suzuki Swift')).toBeTruthy();
  });

  it('matches hashtags too', async () => {
    const app = renderFeed();
    await app;
    await screen.findByText('Suzuki Swift');

    await search('#vinyl');

    expect(await screen.findByText('Record player, works great')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Suzuki Swift')).toBeNull());
  });

  it('says when nothing matches, and clearing the search brings the feed back', async () => {
    const app = renderFeed();
    await app;
    await screen.findByText('Suzuki Swift');

    await search('zzz');
    expect(await screen.findByText('No results for “zzz”')).toBeTruthy();

    await search('');
    expect(await screen.findByText('Suzuki Swift')).toBeTruthy();
  });

  it('waits for typing to pause before searching', async () => {
    const products = new FakeProductRepository();
    const spy = jest.spyOn(products, 'searchProducts');
    const app = renderFeed(products);
    await app;
    await screen.findByText('Suzuki Swift');

    await search('s');
    await search('sw');
    await search('swi');

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith('swi');
  });
});
