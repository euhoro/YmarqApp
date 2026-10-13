// Jest has no notification system: use the web push client (push unsupported) unless a test
// passes its own `push` service (see FakePushClient).
jest.mock('@/services/notifications/expoPushClient', () =>
  jest.requireActual('@/services/notifications/expoPushClient.web'),
);
