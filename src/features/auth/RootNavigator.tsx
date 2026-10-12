import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { useAuthReady, useCurrentUser } from './useCurrentUser';

/**
 * The auth gate. Signed-in users get the screens in `src/app/(app)/` (any new screen there is private
 * automatically); signed-out users only get `/sign-in`. When the auth state changes, Expo Router
 * redirects to the first screen that is allowed. Until the saved session is restored it shows a
 * spinner, so a signed-in user isn't bounced to `/sign-in` on reload.
 */
export function RootNavigator() {
  const ready = useAuthReady();
  const signedIn = useCurrentUser() !== null;

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
