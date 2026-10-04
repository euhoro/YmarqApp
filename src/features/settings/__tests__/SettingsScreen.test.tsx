import { renderRouter, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { PaperProvider } from 'react-native-paper';

import { FakeAuthService } from '@/services/auth/FakeAuthService';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';
import { ServicesProvider } from '@/services/ServicesProvider';

import { SettingsScreen } from '../SettingsScreen';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '9.9.9' } },
}));

function renderSettings(auth: FakeAuthService) {
  return renderRouter(
    { settings: SettingsScreen, 'sign-in': () => null },
    {
      initialUrl: '/settings',
      wrapper: ({ children }) => (
        <ServicesProvider services={{ auth, products: new FakeProductRepository() }}>
          <PaperProvider>{children}</PaperProvider>
        </ServicesProvider>
      ),
    },
  );
}

describe('SettingsScreen', () => {
  it('shows the user, data source and app version', async () => {
    await renderSettings(new FakeAuthService());

    expect(screen.getByText('1111111111')).toBeTruthy(); // demo user id (no phone number)
    expect(screen.getByText('fake')).toBeTruthy();
    expect(screen.getByText('9.9.9')).toBeTruthy();
  });

  it('prefers the phone number when the user has one', async () => {
    await renderSettings(
      new FakeAuthService({ id: 'u1', phoneNumber: '+972501234567', email: null }),
    );

    expect(screen.getByText('+972501234567')).toBeTruthy();
  });

  it('signs out and goes to sign-in', async () => {
    const auth = new FakeAuthService();
    const app = renderSettings(auth);
    await app;

    await fireEvent.press(screen.getByText('Sign out'));

    await waitFor(() => expect(app.getPathname()).toBe('/sign-in'));
    expect(auth.getCurrentUser()).toBeNull();
  });

  it('offers sign-in when signed out', async () => {
    const app = renderSettings(new FakeAuthService(null));
    await app;

    expect(screen.getByText('Not signed in')).toBeTruthy();
    await fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => expect(app.getPathname()).toBe('/sign-in'));
  });
});
