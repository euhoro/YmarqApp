import { upload as blobUpload } from '@vercel/blob/client';

import type { TokenProvider } from '../api/ApiClient';

export type PhotoUploader = (localUri: string, userId: string) => Promise<string>;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/** True for photos still on the device (file://, blob:, data:), which must be uploaded first. */
export const isLocalPhoto = (uri: string) => !/^https?:\/\//i.test(uri);

/**
 * Uploads a listing photo straight to Vercel Blob with a short-lived permission from the API
 * (`POST /v1/uploads`, `server/src/routes/uploads.ts`), and returns its public URL.
 * The server only allows `listings/<your user id>/<file name>`, images, up to 10 MB.
 */
export function createApiPhotoUploader(
  apiUrl: string,
  getToken: TokenProvider,
  upload: typeof blobUpload = blobUpload,
  // Wrapped: browsers throw "Illegal invocation" when fetch is called as a method of another object.
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
): PhotoUploader {
  return async (localUri, userId) => {
    // Works for file:// on iOS/Android and blob:/data: URLs on web.
    const photo = await (await fetchFn(localUri)).blob();
    const contentType = EXTENSIONS[photo.type] ? photo.type : 'image/jpeg';
    const token = await getToken();
    const blob = await upload(`listings/${userId}/photo.${EXTENSIONS[contentType]}`, photo, {
      access: 'public',
      contentType,
      handleUploadUrl: `${apiUrl}/v1/uploads`,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return blob.url;
  };
}
