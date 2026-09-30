import { getDataSource, getLegacyApiUrl } from '../env';

describe('getDataSource', () => {
  it('defaults to fake', () => {
    expect(getDataSource('')).toBe('fake');
  });

  it('accepts every known source', () => {
    expect(getDataSource('fake')).toBe('fake');
    expect(getDataSource('firestore')).toBe('firestore');
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
