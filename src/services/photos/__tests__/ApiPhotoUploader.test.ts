import { createApiPhotoUploader, isLocalPhoto } from '../ApiPhotoUploader';

const API = 'https://ymarq-app-api.vercel.app';

function setup(type: string) {
  const photo = { type } as Blob;
  const fetchFn = jest.fn().mockResolvedValue({ blob: async () => photo });
  const upload = jest
    .fn()
    .mockResolvedValue({ url: 'https://store.public.blob.vercel-storage.com/p.png' });
  const uploader = createApiPhotoUploader(API, async () => 'firebase-token', upload, fetchFn);
  return { uploader, upload, fetchFn, photo };
}

describe('createApiPhotoUploader', () => {
  it("uploads to the user's folder with a permission from the API", async () => {
    const { uploader, upload, fetchFn, photo } = setup('image/png');

    const url = await uploader('file:///photo.png', 'uid-1');

    expect(url).toBe('https://store.public.blob.vercel-storage.com/p.png');
    expect(fetchFn).toHaveBeenCalledWith('file:///photo.png');
    expect(upload).toHaveBeenCalledWith('listings/uid-1/photo.png', photo, {
      access: 'public',
      contentType: 'image/png',
      handleUploadUrl: `${API}/v1/uploads`,
      headers: { Authorization: 'Bearer firebase-token' },
    });
  });

  it('treats unknown photo types as JPEG', async () => {
    const { uploader, upload } = setup('');

    await uploader('blob:http://localhost/1', 'uid-1');

    expect(upload.mock.calls[0][0]).toBe('listings/uid-1/photo.jpg');
    expect(upload.mock.calls[0][2].contentType).toBe('image/jpeg');
  });
});

describe('isLocalPhoto', () => {
  it('knows device photos from online ones', () => {
    expect(isLocalPhoto('file:///a.jpg')).toBe(true);
    expect(isLocalPhoto('blob:http://localhost/1')).toBe(true);
    expect(isLocalPhoto('data:image/png;base64,AAA')).toBe(true);
    expect(isLocalPhoto('https://picsum.photos/1')).toBe(false);
  });
});
