import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import FeedScreen from '@/app/(app)/index';
import NewListingScreen from '@/app/(app)/new-listing';
import RegisterRoute from '@/app/(app)/register';
import SettingsScreen from '@/app/(app)/settings';
import RootLayout from '@/app/_layout';
import SignInScreen from '@/app/sign-in';

// Integration test: the real root layout (providers + stack) with the real screens.
// renderRouter returns a promise (RNTL 14 renders asynchronously) that also carries the
// router helpers, so keep the handle for getPathname() and await it before querying.
const routes = {
  _layout: RootLayout,
  '(app)/_layout': AppLayout,
  '(app)/index': FeedScreen,
  '(app)/settings': SettingsScreen,
  '(app)/new-listing': NewListingScreen,
  '(app)/register': RegisterRoute,
  'sign-in': SignInScreen,
};

describe('app navigation', () => {
  it('opens on the feed with products and the camera button', async () => {
    const app = renderRouter(routes);
    await app;

    expect(await screen.findByText('Suzuki Swift')).toBeTruthy(); // fake data source
    expect(screen.getByLabelText('Take photo')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('opens settings by URL', async () => {
    const app = renderRouter(routes, { initialUrl: '/settings' });
    await app;

    expect(await screen.findByText('Signed in as')).toBeTruthy();
    expect(app.getPathname()).toBe('/settings');
  });

  // The header buttons (Settings, Refresh) are covered by e2e/smoke.spec.ts:
  // the native-stack header isn't rendered in Jest.

  it('sends signed-in users away from /sign-in to the feed', async () => {
    const app = renderRouter(routes, { initialUrl: '/sign-in' });
    await app;

    await waitFor(() => expect(app.getPathname()).toBe('/'));
  });
});
