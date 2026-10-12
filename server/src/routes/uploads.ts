import { handleUpload, type HandleUploadOptions } from '@vercel/blob/client';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import type { AppEnv } from '../env.js';

/** The part of `@vercel/blob/client`'s `handleUpload` this route uses; tests pass a fake. */
export type BlobUploadHandler = (
  options: Pick<HandleUploadOptions, 'body' | 'request' | 'onBeforeGenerateToken'>,
) => Promise<{ type: string; clientToken?: string }>;

export interface UploadRouteOptions {
  /** Defaults to the real `handleUpload` (needs `BLOB_READ_WRITE_TOKEN`). */
  handleUpload?: BlobUploadHandler;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** What `upload()` from `@vercel/blob/client` posts to ask for a client token. */
const TokenRequestSchema = z.object({
  type: z.literal('blob.generate-client-token'),
  payload: z.object({
    pathname: z.string().min(1).max(300),
    clientPayload: z.string().max(1000).nullable().optional(),
    multipart: z.boolean().optional(),
  }),
});

/** A plain file name: letters, digits, `_`, `-`, `.`; no path separators, not starting with a dot. */
const FILE_NAME = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}$/;

/**
 * `/v1/uploads`: issues short-lived Vercel Blob client tokens so the app uploads a listing photo
 * straight to Blob (`upload()` from `@vercel/blob/client` with `handleUploadUrl` pointing here), then
 * sends the returned blob `url` as `imageUrl` in `POST /v1/products`.
 *
 * The token only allows images up to 10 MB at `listings/<userId>/<file>` (plus a random suffix), so a
 * user can't write into someone else's folder or overwrite a blob. There is no `onUploadCompleted`
 * webhook: the app already gets the URL from `upload()`, and the webhook would arrive without a
 * sign-in token.
 */
export function uploadRoutes({ handleUpload: handle = handleUpload }: UploadRouteOptions = {}) {
  return new Hono<AppEnv>().post('/', async (c) => {
    const parsed = TokenRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: 'Invalid upload request', issues: parsed.error.issues }, 400);
    }

    const userId = c.get('user').id;
    const { pathname, clientPayload = null, multipart = false } = parsed.data.payload;
    const prefix = `listings/${userId}/`;
    if (!pathname.startsWith(prefix) || !FILE_NAME.test(pathname.slice(prefix.length))) {
      return c.json({ error: `Upload path must be ${prefix}<file name>` }, 400);
    }

    try {
      const result = await handle({
        request: c.req.raw,
        body: {
          type: 'blob.generate-client-token',
          payload: { pathname, clientPayload, multipart },
        },
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ userId }),
        }),
      });
      return c.json(result);
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      // Usually missing Blob credentials (BLOB_READ_WRITE_TOKEN) on the deployment.
      console.error('Blob client token failed', error);
      return c.json({ error: 'Photo upload is not available right now' }, 503);
    }
  });
}
