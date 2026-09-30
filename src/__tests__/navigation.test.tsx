import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import FeedScreen from '@/app/index';
import SettingsScreen from '@/app/settings';
import SignInScreen from '@/app/sign-in';

// Integration test: the real root layout (providers + stack) with the real screens.
// renderRouter returns a promise (RNTL 14 renders asynchronously) that also carries the
// router helpers, so keep the handle for getPathname() and await it before querying.
const routes = {
  _layout: RootLayout,
  index: FeedScreen,
  settings: SettingsScreen,
  'sign-in': SignInScreen,
};

describe('app navigation', () => {
  it('opens on the feed', async () => {
    const app = renderRouter(routes);
    await app;

    expect(await screen.findByText(/Products feed/)).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('navigates from the feed to settings', async () => {
    const app = renderRouter(routes);
    await app;

    await fireEvent.press(await screen.findByText('Settings'));

    expect(await screen.findByText(/Settings \(coming in F7\)/)).toBeTruthy();
    expect(app.getPathname()).toBe('/settings');
  });

  it('deep-links to sign-in', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });

    expect(await screen.findByText(/Phone sign-in/)).toBeTruthy();
  });
});
