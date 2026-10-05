import { Stack } from 'expo-router';

// Screens for signed-in users. Add new private screens to this folder; they are protected by RootNavigator.
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Ymarq' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="new-listing" options={{ title: 'New listing' }} />
    </Stack>
  );
}
