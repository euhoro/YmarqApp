import { afterEach, describe, expect, it, vi } from 'vitest';

import { devVerifier } from '../../auth/verifier.js';
import { createApp } from '../../createApp.js';
import { createStores } from '../../stores/index.js';
import type { BlobUploadHandler } from '../uploads.js';

/** What `upload()` from `@vercel/blob/client` posts to the handleUploadUrl. */
const tokenRequest = (pathname: string) => ({
  type: 'blob.generate-client-token',
  payload: { pathname, clientPayload: null, multipart: false },
});

function setup(handleUpload: BlobUploadHandler) {
  const fake = vi.fn(handleUpload);
  const app = createApp({
    stores: createStores('memory'),
    verifyToken: devVerifier,
    handleUpload: fake,
  });
  const post = (body: unknown, user: string | null = 'dana') =>
    app.request('/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user ? { Authorization: `Bearer dev:${user}` } : {}),
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  return { fake, post };
}

/** Fake SDK: runs `onBeforeGenerateToken` like the real one and returns a token. */
const issuesToken: BlobUploadHandler = async ({ body, onBeforeGenerateToken }) => {
  if (body.type === 'blob.generate-client-token') {
    const { pathname, clientPayload, multipart } = body.payload;
    await onBeforeGenerateToken(pathname, clientPayload, multipart);
  }
  return { type: 'blob.generate-client-token', clientToken: 'vercel_blob_client_test' };
};

afterEach(() => vi.restoreAllMocks());

describe('/v1/uploads', () => {
  it('requires sign-in', async () => {
    const { fake, post } = setup(issuesToken);

    const response = await post(tokenRequest('listings/dana/photo.jpg'), null);

    expect(response.status).toBe(401);
    expect(fake).not.toHaveBeenCalled();
  });

  it('returns a client token limited to images up to 10 MB in the caller’s folder', async () => {
    const { fake, post } = setup(issuesToken);

    const response = await post(tokenRequest('listings/dana/photo.jpg'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      type: 'blob.generate-client-token',
      clientToken: 'vercel_blob_client_test',
    });
    expect(fake).toHaveBeenCalledOnce();
    const [options] = fake.mock.calls[0]!;
    expect(options.body).toEqual(tokenRequest('listings/dana/photo.jpg'));
    expect(options.request).toBeInstanceOf(Request);
    expect(await options.onBeforeGenerateToken('listings/dana/photo.jpg', null, false)).toEqual({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: true,
      allowOverwrite: false,
      tokenPayload: JSON.stringify({ userId: 'dana' }),
    });
  });

  it.each([
    ['not JSON', 'nope'],
    ['an upload-completed webhook', { type: 'blob.upload-completed', payload: {} }],
    ['a missing pathname', { type: 'blob.generate-client-token', payload: {} }],
  ])('rejects %s with 400', async (_name, body) => {
    const { fake, post } = setup(issuesToken);

    const response = await post(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'Invalid upload request' });
    expect(fake).not.toHaveBeenCalled();
  });

  it.each([
    'listings/avi/photo.jpg',
    'photo.jpg',
    'listings/dana/',
    'listings/dana/../avi/photo.jpg',
    'listings/dana/sub/photo.jpg',
    'listings/dana/.hidden',
  ])('rejects the path %s with 400', async (pathname) => {
    const { fake, post } = setup(issuesToken);

    const response = await post(tokenRequest(pathname));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Upload path must be listings/dana/<file name>',
    });
    expect(fake).not.toHaveBeenCalled();
  });

  it('answers 503 JSON when the Blob SDK fails (e.g. no BLOB_READ_WRITE_TOKEN)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { post } = setup(async () => {
      throw new Error('No read-write token found.');
    });

    const response = await post(tokenRequest('listings/dana/photo.jpg'));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Photo upload is not available right now' });
  });
});
