import { getApiUrl, getDataSource, type DataSource } from '@/config/env';

import { ApiClient } from '../api/ApiClient';
import type { AuthService } from '../auth/AuthService';
import { ApiNotificationsRepository } from './ApiNotificationsRepository';
import { FakeNotificationsRepository } from './FakeNotificationsRepository';
import type { NotificationsRepository } from './NotificationsRepository';

export { createPushClient } from './expoPushClient';
export type { NotificationsRepository } from './NotificationsRepository';
export type { PushClient, PushPermission } from './PushClient';

/** Devices are registered on the API for `api`; the other sources keep them in memory. */
export function createNotificationsRepository(
  auth: AuthService,
  source: DataSource = getDataSource(),
): NotificationsRepository {
  if (source === 'api') {
    return new ApiNotificationsRepository(new ApiClient(getApiUrl(), () => auth.getIdToken()));
  }
  return new FakeNotificationsRepository();
}
