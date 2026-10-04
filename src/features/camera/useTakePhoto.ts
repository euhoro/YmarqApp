import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

/**
 * Opens the system camera (a file/camera picker on web) and resolves to the photo's URI,
 * or null when the user cancels or denies camera permission.
 */
export function useTakePhoto() {
  const [permissionDenied, setPermissionDenied] = useState(false);

  const takePhoto = useCallback(async (): Promise<string | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionDenied(true);
      return null;
    }
    setPermissionDenied(false);

    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
    if (result.canceled) return null;
    return result.assets[0]?.uri ?? null;
  }, []);

  return { takePhoto, permissionDenied };
}
