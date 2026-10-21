import type { PushClient, PushPermission } from './PushClient';

/** A scriptable PushClient for tests: set `permission` / `answer`, and `tap()` a notification. */
export class FakePushClient implements PushClient {
  isSupported = true;
  permission: PushPermission = 'undetermined';
  /** What the user picks in the system prompt. */
  answer: PushPermission = 'granted';
  token = 'ExponentPushToken[fake-phone]';
  requests = 0;
  private listeners = new Set<(url: string) => void>();

  async getPermission() {
    return this.permission;
  }

  async requestPermission() {
    this.requests++;
    this.permission = this.answer;
    return this.permission;
  }

  async getToken() {
    return this.token;
  }

  onOpenUrl(listener: (url: string) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Simulates the user tapping a notification that carries `url`. */
  tap(url: string) {
    this.listeners.forEach((listener) => listener(url));
  }
}
