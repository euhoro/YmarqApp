import { QueryClient } from '@tanstack/react-query';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import FeedScreen from '@/app/(app)/index';
import ListingRoute from '@/app/(app)/listing/[id]';
import SettingsRoute from '@/app/(app)/settings';
import SignInScreen from '@/app/sign-in';
import { AppProviders } from '@/providers/AppProviders';
import { FakeAuthService } from '@/services/auth/FakeAuthService';
import { FakeNotificationsRepository } from '@/services/notifications/FakeNotificationsRepository';
import { FakePushClient } from '@/services/notifications/FakePushClient';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';

function setup(permission: FakePushClient['permission'] = 'undetermined') {
  const push = new FakePushClient();
  push.permission = permission;
  return {
    auth: new FakeAuthService(),
    products: new FakeProductRepository(),
    notifications: new FakeNotificationsRepository(),
    push,
  };
}

async function renderApp(services: ReturnType<typeof setup>, initialUrl = '/') {
  const app = renderRouter(
    {
      '(app)/_layout': AppLayout,
      '(app)/index': FeedScreen,
      '(app)/settings': SettingsRoute,
      '(app)/listing/[id]': ListingRoute,
      'sign-in': SignInScreen,
    },
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
  await app;
  if (initialUrl === '/') await screen.findByText('Suzuki Swift');
  // Wrapped: the handle is a thenable, so returning it bare from an async function would unwrap it.
  return { app };
}

describe('push notifications', () => {
  it('explains first, then asks the system and registers this phone', async () => {
    const services = setup();
    await renderApp(services);

    expect(await screen.findByText('Turn on notifications?')).toBeTruthy();
    expect(services.push.requests).toBe(0);
    await fireEvent.press(screen.getByText('Turn on'));

    await waitFor(() => expect([...services.notifications.tokens]).toEqual([services.push.token]));
    expect(services.push.requests).toBe(1);
  });

  it('"Not now" closes the explanation without the system prompt', async () => {
    const services = setup();
    await renderApp(services);

    await fireEvent.press(await screen.findByText('Not now'));

    await waitFor(() => expect(screen.queryByText('Turn on notifications?')).toBeNull());
    expect(services.push.requests).toBe(0);
    expect(services.notifications.tokens.size).toBe(0);
  });

  it('a denied system prompt registers nothing', async () => {
    const services = setup();
    services.push.answer = 'denied';
    await renderApp(services);

    await fireEvent.press(await screen.findByText('Turn on'));

    await waitFor(() => expect(services.push.requests).toBe(1));
    expect(services.notifications.tokens.size).toBe(0);
  });

  it('registers silently when already allowed, and never asks when denied', async () => {
    const allowed = setup('granted');
    await renderApp(allowed);
    await waitFor(() => expect(allowed.notifications.tokens.size).toBe(1));
    expect(screen.queryByText('Turn on notifications?')).toBeNull();
  });

  it('never asks again after the user said no in the system prompt', async () => {
    const denied = setup('denied');
    await renderApp(denied);
    expect(screen.queryByText('Turn on notifications?')).toBeNull();
    expect(denied.push.requests).toBe(0);
  });

  it('signing out unregisters this phone first', async () => {
    const services = setup('granted');
    await renderApp(services, '/settings');
    await waitFor(() => expect(services.notifications.tokens.size).toBe(1));

    await fireEvent.press(await screen.findByText('Sign out'));

    await waitFor(() => expect(services.auth.getCurrentUser()).toBeNull());
    expect(services.notifications.tokens.size).toBe(0);
  });
});
