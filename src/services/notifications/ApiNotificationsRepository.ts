import type { ApiClient } from '../api/ApiClient';
import type { NotificationsRepository } from './NotificationsRepository';

/** `/v1/devices` on the Ymarq API (`server/src/routes/devices.ts`). */
export class ApiNotificationsRepository implements NotificationsRepository {
  constructor(private readonly client: ApiClient) {}

  async registerDevice(token: string): Promise<void> {
    await this.client.request('/v1/devices', { method: 'POST', body: { token } });
  }

  async unregisterDevice(token: string): Promise<void> {
    await this.client.request(`/v1/devices/${encodeURIComponent(token)}`, { method: 'DELETE' });
  }
}
