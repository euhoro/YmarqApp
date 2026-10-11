import { getApiUrl, getDataSource, getLegacyApiUrl } from '../env';

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
