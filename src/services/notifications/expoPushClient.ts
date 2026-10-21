import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PushClient, PushPermission } from './PushClient';

const toPermission = ({
  status,
  canAskAgain,
}: Notifications.NotificationPermissionsStatus): PushPermission => {
  if (status === 'granted') return 'granted';
  return status === 'denied' && !canAskAgain ? 'denied' : 'undetermined';
};

const urlOf = (response: Notifications.NotificationResponse | null) => {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' ? url : null;
};

/** Push through Expo's service (`server/src/push/`), which delivers to APNs and FCM. */
export function createPushClient(): PushClient {
  // Show notifications that arrive while the app is open, too.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return {
    isSupported: true,
    async getPermission() {
      return toPermission(await Notifications.getPermissionsAsync());
    },
    async requestPermission() {
      // Android 13+ only shows the prompt once a channel exists.
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Messages and alerts',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      return toPermission(await Notifications.requestPermissionsAsync());
    },
    async getToken() {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    },
    onOpenUrl(listener) {
      const launchUrl = urlOf(Notifications.getLastNotificationResponse());
      if (launchUrl) listener(launchUrl);
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const url = urlOf(response);
        if (url) listener(url);
      });
      return () => subscription.remove();
    },
  };
}
