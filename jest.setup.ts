// Jest has no notification system: use the web push client (push unsupported) unless a test
// passes its own `push` service (see FakePushClient).
jest.mock('@/services/notifications/expoPushClient', () =>
  jest.requireActual('@/services/notifications/expoPushClient.web'),
);

// The native Firebase SDK can't load in Jest. Tests that need it mock its functions themselves.
jest.mock('@react-native-firebase/auth', () => ({}));
