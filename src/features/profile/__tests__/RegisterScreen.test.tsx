import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import FeedScreen from '@/app/(app)/index';
import NewListingScreen from '@/app/(app)/new-listing';
import RegisterRoute from '@/app/(app)/register';
import SettingsScreen from '@/app/(app)/settings';
import { normalizeDisplayName } from '@/domain/user';
import { AppProviders } from '@/providers/AppProviders';
import { FakeAuthService } from '@/services/auth/FakeAuthService';
import { FakeProfileRepository } from '@/services/profile/FakeProfileRepository';

const NEW_USER = { id: 'phone:+972501234567', phoneNumber: '+972501234567', email: null };

function renderApp(profiles: FakeProfileRepository, initialUrl = '/') {
  return renderRouter(
    {
      '(app)/_layout': AppLayout,
      '(app)/index': FeedScreen,
      '(app)/settings': SettingsScreen,
      '(app)/new-listing': NewListingScreen,
      '(app)/register': RegisterRoute,
    },
    {
      initialUrl,
      wrapper: ({ children }) => (
        <AppProviders services={{ auth: new FakeAuthService(NEW_USER), profiles }}>
          {children}
        </AppProviders>
      ),
    },
  );
}

describe('normalizeDisplayName', () => {
  it.each([
    ['  Dana  ', 'Dana'],
    ['Dana   Cohen', 'Dana Cohen'],
    ['דנה', 'דנה'],
  ])('%s → %s', (input, expected) => expect(normalizeDisplayName(input)).toBe(expected));

  it.each(['', ' ', 'D', 'x'.repeat(41)])('rejects "%s"', (input) =>
    expect(normalizeDisplayName(input)).toBeNull(),
  );
});

describe('registration (choose a display name)', () => {
  it('sends users without a profile to /register, even from another screen', async () => {
    const app = renderApp(new FakeProfileRepository([]), '/settings');
    await app;

    expect(await screen.findByText("What's your name?")).toBeTruthy();
    expect(app.getPathname()).toBe('/register');
  });

  it('validates the name, saves it and continues to the feed', async () => {
    const profiles = new FakeProfileRepository([]);
    const app = renderApp(profiles);
    await app;

    await fireEvent.changeText(await screen.findByLabelText('Your name'), 'D');
    expect(screen.getByText(/Use 2–40 characters/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Your name'), '  Dana  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(app.getPathname()).toBe('/'));
    expect(await profiles.getProfile(NEW_USER.id)).toEqual({
      userId: NEW_USER.id,
      displayName: 'Dana',
    });
  });

  it('skips registration for users who already have a name', async () => {
    const profiles = new FakeProfileRepository([{ userId: NEW_USER.id, displayName: 'Dana' }]);
    const app = renderApp(profiles, '/register');
    await app;

    await waitFor(() => expect(app.getPathname()).toBe('/'));
  });
});
