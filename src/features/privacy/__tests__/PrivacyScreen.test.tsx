import { renderRouter, screen } from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import FeedScreen from '@/app/(app)/index';
import PrivacyRoute from '@/app/privacy';
import SignInRoute from '@/app/sign-in';
import { RootNavigator } from '@/features/auth/RootNavigator';
import { AppProviders } from '@/providers/AppProviders';
import { DEMO_USER, FakeAuthService } from '@/services/auth/FakeAuthService';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';

function renderAt(auth: FakeAuthService) {
  const RootLayout = () => (
    <AppProviders services={{ auth, products: new FakeProductRepository() }}>
      <RootNavigator />
    </AppProviders>
  );
  return renderRouter(
    {
      _layout: RootLayout,
      '(app)/_layout': AppLayout,
      '(app)/index': FeedScreen,
      'sign-in': SignInRoute,
      privacy: PrivacyRoute,
    },
    { initialUrl: '/privacy' },
  );
}

describe('privacy policy', () => {
  it.each([
    ['signed out', null],
    ['signed in', DEMO_USER],
  ])('opens by URL when %s', async (_label, user) => {
    const app = renderAt(new FakeAuthService(user));
    await app;

    expect(await screen.findByText('Ymarq privacy policy')).toBeTruthy();
    expect(screen.getByText(/Your phone number, to sign you in/)).toBeTruthy();
    expect(screen.getByText(/Firebase Authentication/)).toBeTruthy();
    expect(screen.getByText(/camera or your photo library/)).toBeTruthy();
    expect(app.getPathname()).toBe('/privacy');
  });
});
