import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

/**
 * Colours from the 2014 Ymarq logo (assets/legacy/ym_logo.jpg): neon cyan #00E5FF, lime #C6FF00 and
 * magenta #FF00E0 on black. Dark mode uses them as-is on black; light mode uses darker tones of the same
 * hues so text and buttons keep WCAG AA contrast (≥ 4.5:1) on white.
 */
export const brand = {
  cyan: '#00E5FF',
  lime: '#C6FF00',
  magenta: '#FF00E0',
  black: '#000000',
} as const;

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#006B7A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#A6EEFF',
    onPrimaryContainer: '#001F25',
    secondary: '#4A6600',
    onSecondary: '#FFFFFF',
    secondaryContainer: brand.lime,
    onSecondaryContainer: '#141F00',
    tertiary: '#A3007F',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD7F0',
    onTertiaryContainer: '#3A002C',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brand.cyan,
    onPrimary: '#00363D',
    primaryContainer: '#004F59',
    onPrimaryContainer: '#A6EEFF',
    secondary: brand.lime,
    onSecondary: '#253500',
    secondaryContainer: '#374D00',
    onSecondaryContainer: '#DFFF9E',
    tertiary: '#FF5CE6',
    onTertiary: '#5C0047',
    tertiaryContainer: '#830066',
    onTertiaryContainer: '#FFD7F0',
    background: brand.black,
    surface: '#121212',
    surfaceVariant: '#1F2A2C',
    onSurface: '#E3E3E3',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#121414',
      level2: '#161A1B',
    },
  },
};
