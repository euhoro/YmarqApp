import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { FAB, Portal, Snackbar } from 'react-native-paper';

import { useTakePhoto } from './useTakePhoto';

/** Floating camera button (bottom-right by default). Opens the new-listing screen with the photo. */
export function TakePhotoFab({ style }: { style?: StyleProp<ViewStyle> }) {
  const { takePhoto, permissionDenied } = useTakePhoto();
  const [snackbarDismissed, setSnackbarDismissed] = useState(false);

  const onPress = async () => {
    setSnackbarDismissed(false);
    const photoUri = await takePhoto();
    if (photoUri) router.push({ pathname: '/new-listing', params: { photoUri } });
  };

  return (
    <>
      <FAB
        icon="camera"
        accessibilityLabel="Take photo"
        onPress={onPress}
        style={[styles.fab, style]}
      />
      <Portal>
        <Snackbar
          visible={permissionDenied && !snackbarDismissed}
          onDismiss={() => setSnackbarDismissed(true)}
        >
          Camera permission is needed to take photos. You can allow it in your device settings.
        </Snackbar>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
