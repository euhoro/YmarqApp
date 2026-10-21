import { AuthError } from '../AuthService';
import { toAuthError } from '../firebaseErrors';

const firebaseError = (code: string) =>
  Object.assign(new Error(`Firebase: Error (${code}).`), { code });

describe('toAuthError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('explains errors the user can fix', () => {
    const error = toAuthError(firebaseError('auth/invalid-phone-number'));

    expect(error).toBeInstanceOf(AuthError);
    expect(error).toMatchObject({ code: 'auth/invalid-phone-number', message: /not valid/ });
  });

  it('says sign-in is unavailable, with the code, when billing or setup is wrong', () => {
    const error = toAuthError(firebaseError('auth/billing-not-enabled'));

    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).message).toBe(
      'Sign-in by SMS is temporarily unavailable. Please try again later. (auth/billing-not-enabled)',
    );
  });

  it('passes unknown errors through and logs them', () => {
    const original = firebaseError('auth/something-new');

    expect(toAuthError(original)).toBe(original);
    expect(console.warn).toHaveBeenCalledWith('Firebase sign-in failed', original);
  });
});
