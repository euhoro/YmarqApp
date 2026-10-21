import type { PushClient } from './PushClient';

/** Web push is out of scope for now (#47): the browser app gets no notifications. */
export function createPushClient(): PushClient {
  const unsupported = () =>
    Promise.reject(new Error('Push notifications are not available on web.'));
  return {
    isSupported: false,
    getPermission: unsupported,
    requestPermission: unsupported,
    getToken: unsupported,
    onOpenUrl: () => () => {},
  };
}
