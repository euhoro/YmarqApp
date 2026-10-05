import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { ServicesProvider, type Services } from '@/services/ServicesProvider';
import { darkTheme, lightTheme } from '@/theme/theme';

/** Everything the app runs inside: services, data cache, Paper and navigation themes. Tests pass fake `services`. */
export function AppProviders({ services, children }: { services?: Services; children: ReactNode }) {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(() => new QueryClient());
  const paperTheme = colorScheme === 'dark' ? darkTheme : lightTheme;
  // Headers and screen backgrounds come from React Navigation's theme; derive it from Paper's.
  const baseNavigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: paperTheme.colors.primary,
      background: paperTheme.colors.background,
      card: paperTheme.colors.surface,
      text: paperTheme.colors.onSurface,
      border: paperTheme.colors.outlineVariant,
    },
  };

  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <ThemeProvider value={navigationTheme}>
            {children}
            <StatusBar style="auto" />
          </ThemeProvider>
        </PaperProvider>
      </QueryClientProvider>
    </ServicesProvider>
  );
}
