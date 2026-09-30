import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { ServicesProvider } from '@/services/ServicesProvider';
import { darkTheme, lightTheme } from '@/theme/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ServicesProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Ymarq' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
          </Stack>
          <StatusBar style="auto" />
        </PaperProvider>
      </QueryClientProvider>
    </ServicesProvider>
  );
}
