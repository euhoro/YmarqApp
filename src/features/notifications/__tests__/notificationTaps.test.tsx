// Its own file: expo-router's test state keeps the last navigation, which would leak into other tests.
import { QueryClient } from '@tanstack/react-query';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';

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

const SUZUKI_ID = 'e7b6646b-4718-4abf-8260-73188d395c30';

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

describe('tapping a push notification', () => {
  it('a tapped notification opens its screen; unknown links are ignored', async () => {
    const services = setup('granted');
    const { app } = await renderApp(services);

    act(() => services.push.tap('/settings/../evil'));
    expect(app.getPathname()).toBe('/');

    act(() => services.push.tap(`/listing/${SUZUKI_ID}`));
    await waitFor(() => expect(app.getPathname()).toBe(`/listing/${SUZUKI_ID}`));
  });
});
