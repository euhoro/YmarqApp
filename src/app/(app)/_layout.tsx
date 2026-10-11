import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { useProfile } from '@/features/profile/useProfile';

// Screens for signed-in users (protected by RootNavigator). New private screens go in this folder and
// inside the `hasProfile` group: users must choose a display name (/register) before using the app.
export default function AppLayout() {
  const profile = useProfile();

  if (profile.isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator testID="profile-loading" />
      </View>
    );
  }
  const hasProfile = profile.data != null;

  return (
    <Stack>
      <Stack.Protected guard={hasProfile}>
        <Stack.Screen name="index" options={{ title: 'Ymarq' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="new-listing" options={{ title: 'New listing' }} />
      </Stack.Protected>
      <Stack.Protected guard={!hasProfile}>
        <Stack.Screen name="register" options={{ title: 'Welcome' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
