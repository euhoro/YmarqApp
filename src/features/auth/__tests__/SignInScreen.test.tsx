import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import FeedScreen from '@/app/(app)/index';
import NewListingScreen from '@/app/(app)/new-listing';
import RegisterRoute from '@/app/(app)/register';
import SettingsScreen from '@/app/(app)/settings';
import SignInRoute from '@/app/sign-in';
import { AppProviders } from '@/providers/AppProviders';
import { FAKE_SMS_CODE, FakeAuthService } from '@/services/auth/FakeAuthService';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';

import { RootNavigator } from '../RootNavigator';

function renderApp(auth: FakeAuthService, initialUrl = '/') {
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
      '(app)/settings': SettingsScreen,
      '(app)/new-listing': NewListingScreen,
      '(app)/register': RegisterRoute,
      'sign-in': SignInRoute,
    },
    { initialUrl },
  );
}

async function enterPhone(number: string) {
  await fireEvent.changeText(screen.getByLabelText('Phone number'), number);
}

describe('sign-in and auth gate', () => {
  it('sends signed-out users to sign-in, even from a private URL', async () => {
    const app = renderApp(new FakeAuthService(null), '/settings');
    await app;

    expect(await screen.findByText('Welcome to Ymarq')).toBeTruthy();
    expect(app.getPathname()).toBe('/sign-in');
  });

  it('only enables "Send code" for a valid mobile number', async () => {
    const app = renderApp(new FakeAuthService(null));
    await app;

    await enterPhone('050-123');
    expect(screen.getByRole('button', { name: 'Send code' })).toBeDisabled();

    await enterPhone('03-123-4567');
    expect(screen.getByText('Enter a valid mobile number')).toBeTruthy();

    await enterPhone('050-123-4567');
    expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled();
  });

  it('shows an error for a wrong code and lets the user change the number', async () => {
    const app = renderApp(new FakeAuthService(null));
    await app;

    await enterPhone('0501234567');
    await fireEvent.press(screen.getByRole('button', { name: 'Send code' }));
    expect(await screen.findByText(/sent to \+972501234567/)).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Code'), '000000');
    await fireEvent.press(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText(/Wrong code/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Change number' }));
    expect(screen.getByLabelText('Phone number')).toBeTruthy();
  });

  it('signs in with the right code; a new user picks a name, then lands on the feed', async () => {
    const auth = new FakeAuthService(null);
    const app = renderApp(auth);
    await app;

    await enterPhone('0501234567');
    await fireEvent.press(screen.getByRole('button', { name: 'Send code' }));
    await fireEvent.changeText(await screen.findByLabelText('Code'), FAKE_SMS_CODE);
    await fireEvent.press(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => expect(app.getPathname()).toBe('/register'));
    expect(auth.getCurrentUser()?.phoneNumber).toBe('+972501234567');

    await fireEvent.changeText(await screen.findByLabelText('Your name'), 'Dana');
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(app.getPathname()).toBe('/'));
    expect(await screen.findByText('Suzuki Swift')).toBeTruthy();
  });

  it('keeps signed-in users out of sign-in', async () => {
    const app = renderApp(new FakeAuthService(), '/sign-in');
    await app;

    await waitFor(() => expect(app.getPathname()).toBe('/'));
  });
});
