import type { NotificationsRepository } from './NotificationsRepository';

/** Remembers registered tokens in memory; nothing is ever sent. */
export class FakeNotificationsRepository implements NotificationsRepository {
  readonly tokens = new Set<string>();

  async registerDevice(token: string): Promise<void> {
    this.tokens.add(token);
  }

  async unregisterDevice(token: string): Promise<void> {
    this.tokens.delete(token);
  }
}
