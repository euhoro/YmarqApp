import { QueryClient } from '@tanstack/react-query';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import AlertsRoute from '@/app/(app)/alerts';
import FeedScreen from '@/app/(app)/index';
import SettingsRoute from '@/app/(app)/settings';
import { AppProviders } from '@/providers/AppProviders';
import { FakeAuthService } from '@/services/auth/FakeAuthService';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';
import { FakeSavedSearchRepository } from '@/services/saved-searches/FakeSavedSearchRepository';

function setup() {
  const auth = new FakeAuthService();
  return {
    auth,
    products: new FakeProductRepository(),
    savedSearches: new FakeSavedSearchRepository(auth),
  };
}

function renderApp(initialUrl: string, services = setup()) {
  return renderRouter(
    { index: FeedScreen, settings: SettingsRoute, alerts: AlertsRoute },
    {
      initialUrl,
      wrapper: ({ children }) => (
        <AppProviders
          services={services}
          queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          {children}
        </AppProviders>
      ),
    },
  );
}

const search = (text: string) =>
  fireEvent.changeText(screen.getByLabelText('Search listings'), text);

describe('saved searches (alerts)', () => {
  it('"Notify me" appears only for a non-empty search', async () => {
    const app = renderApp('/');
    await app;
    await screen.findByText('Suzuki Swift');

    expect(screen.queryByText('Notify me about new matches')).toBeNull();
    await search('swift');
    expect(await screen.findByText('Notify me about new matches')).toBeTruthy();
  });

  it('"Notify me" saves the search, confirms, and then shows it as saved', async () => {
    const services = setup();
    const app = renderApp('/', services);
    await app;
    await screen.findByText('Suzuki Swift');

    await search('  Swift ');
    await fireEvent.press(await screen.findByText('Notify me about new matches'));

    expect(
      await screen.findByText("Alert saved. We'll tell you about new “Swift” listings."),
    ).toBeTruthy();
    expect(await screen.findByText('Alert on for new matches')).toBeTruthy();
    expect(screen.queryByText('Notify me about new matches')).toBeNull();
    expect((await services.savedSearches.listSavedSearches()).map((s) => s.query)).toEqual([
      'Swift',
    ]);
  });

  it('shows the saved state for a query saved before, ignoring case', async () => {
    const services = setup();
    await services.savedSearches.saveSearch('swift');
    const app = renderApp('/', services);
    await app;
    await screen.findByText('Suzuki Swift');

    await search('SWIFT');

    expect(await screen.findByText('Alert on for new matches')).toBeTruthy();
    await fireEvent.press(screen.getByText('Alert on for new matches'));
    await waitFor(() => expect(app.getPathname()).toBe('/alerts'));
  });

  it('Settings links to Alerts, which lists saved searches and deletes them', async () => {
    const services = setup();
    await services.savedSearches.saveSearch('bike');
    await services.savedSearches.saveSearch('sofa');
    const app = renderApp('/settings', services);
    await app;

    await fireEvent.press(await screen.findByText('Alerts'));
    await waitFor(() => expect(app.getPathname()).toBe('/alerts'));
    expect(await screen.findByText('bike')).toBeTruthy();
    expect(screen.getByText('sofa')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Delete alert “bike”'));

    await waitFor(() => expect(screen.queryByText('bike')).toBeNull());
    expect(screen.getByText('sofa')).toBeTruthy();
    expect((await services.savedSearches.listSavedSearches()).map((s) => s.query)).toEqual([
      'sofa',
    ]);
  });

  it('Alerts explains how to add one when there are none', async () => {
    await renderApp('/alerts');

    expect(await screen.findByText('No alerts yet')).toBeTruthy();
  });
});
