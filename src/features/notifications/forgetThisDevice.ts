import type { Services } from '@/services/ServicesProvider';

/**
 * Stops pushes to this phone for the signed-in user. Call it before signing out (the server
 * needs the user's token to accept the request). Never throws: signing out must still work.
 */
export async function forgetThisDevice({
  push,
  notifications,
}: Pick<Services, 'push' | 'notifications'>): Promise<void> {
  if (!push.isSupported) return;
  try {
    if ((await push.getPermission()) !== 'granted') return;
    await notifications.unregisterDevice(await push.getToken());
  } catch (error) {
    console.warn('Could not unregister this device', error);
  }
}
