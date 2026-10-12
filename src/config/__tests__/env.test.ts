import { getApiUrl, getAuthMode, getDataSource, getFirebaseConfig, getLegacyApiUrl } from '../env';

describe('getAuthMode', () => {
  it('defaults to fake and accepts firebase', () => {
    expect(getAuthMode('')).toBe('fake');
    expect(getAuthMode('firebase')).toBe('firebase');
    expect(() => getAuthMode('google')).toThrow(/Unknown EXPO_PUBLIC_AUTH/);
  });
});

describe('getFirebaseConfig', () => {
  it('requires the web app config', () => {
    expect(() => getFirebaseConfig({ projectId: 'ymarq-35862' })).toThrow(/EXPO_PUBLIC_FIREBASE/);
    expect(
      getFirebaseConfig({
        apiKey: 'key',
        authDomain: 'ymarq-35862.firebaseapp.com',
        projectId: 'ymarq-35862',
        appId: 'app',
      }),
    ).toMatchObject({ apiKey: 'key', projectId: 'ymarq-35862' });
  });
});

describe('getDataSource', () => {
  it('defaults to fake', () => {
    expect(getDataSource('')).toBe('fake');
  });

  it('accepts every known source', () => {
    expect(getDataSource('fake')).toBe('fake');
    expect(getDataSource('api')).toBe('api');
    expect(() => getDataSource('firestore')).toThrow();
    expect(getDataSource('legacy')).toBe('legacy');
  });

  it('rejects unknown sources', () => {
    expect(() => getDataSource('mysql')).toThrow(/Unknown EXPO_PUBLIC_DATA_SOURCE/);
  });
});

describe('getLegacyApiUrl', () => {
  it('requires a value and strips trailing slashes', () => {
    expect(() => getLegacyApiUrl('')).toThrow();
    expect(getLegacyApiUrl('https://api.example.com//')).toBe('https://api.example.com');
  });
});

describe('getApiUrl', () => {
  it('requires a value and strips trailing slashes', () => {
    expect(() => getApiUrl('')).toThrow(/EXPO_PUBLIC_API_URL/);
    expect(getApiUrl('https://ymarq-app-api.vercel.app/')).toBe('https://ymarq-app-api.vercel.app');
  });
});
