import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useServices } from '@/services/ServicesProvider';

/** Screens a notification may open (`data.url` from `server/src/push/`). */
const OPENABLE = /^\/(chats|listing)\/[^/?#]+$/;

/**
 * Push notifications for the signed-in user: asks for permission once (with a short explanation
 * first), registers this phone with the server, and opens the right screen when a notification is
 * tapped. Renders only the explanation dialog. Nothing happens on web.
 */
export function PushNotifications() {
  const { push, notifications } = useServices();
  const user = useCurrentUser();
  const [asking, setAsking] = useState(false);

  const register = useCallback(async () => {
    try {
      await notifications.registerDevice(await push.getToken());
    } catch (error) {
      // E.g. a simulator build without push credentials. The app works without notifications.
      console.warn('Push registration failed', error);
    }
  }, [push, notifications]);

  useEffect(() => {
    if (!push.isSupported || !user) return;
    let cancelled = false;
    push
      .getPermission()
      .then((permission) => {
        if (cancelled) return;
        if (permission === 'granted') void register();
        else if (permission === 'undetermined') setAsking(true);
        // 'denied': the user said no in the system prompt; don't nag.
      })
      .catch((error) => console.warn('Push permission check failed', error));
    return () => {
      cancelled = true;
    };
  }, [push, user, register]);

  useEffect(() => {
    if (!push.isSupported) return;
    return push.onOpenUrl((url) => {
      if (OPENABLE.test(url)) router.push(url as Href);
    });
  }, [push]);

  const turnOn = async () => {
    setAsking(false);
    try {
      if ((await push.requestPermission()) === 'granted') await register();
    } catch (error) {
      console.warn('Push permission request failed', error);
    }
  };

  return (
    <Portal>
      <Dialog visible={asking} onDismiss={() => setAsking(false)}>
        <Dialog.Title>Turn on notifications?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            We’ll let you know when someone replies to you, or when a new listing matches one of
            your alerts.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setAsking(false)}>Not now</Button>
          <Button onPress={turnOn}>Turn on</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
