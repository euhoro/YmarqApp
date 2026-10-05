import { Stack } from 'expo-router';

import { useCurrentUser } from './useCurrentUser';

/**
 * The auth gate. Signed-in users get the screens in `src/app/(app)/` (any new screen there is private
 * automatically); signed-out users only get `/sign-in`. When the auth state changes, Expo Router
 * redirects to the first screen that is allowed.
 */
export function RootNavigator() {
  const signedIn = useCurrentUser() !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: true, title: 'Sign in' }} />
      </Stack.Protected>
    </Stack>
  );
}
