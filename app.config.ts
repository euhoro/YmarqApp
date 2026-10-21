import type { ConfigContext, ExpoConfig } from 'expo/config';

// Everything else is in app.json. The Firebase config files for native sign-in are never in git:
// EAS builds get them as file environment variables (`eas env:list`, see docs/ACCOUNTS.md);
// for a local native build, put copies next to this file (they are git-ignored).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  ios: {
    ...config.ios,
    googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
  },
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
