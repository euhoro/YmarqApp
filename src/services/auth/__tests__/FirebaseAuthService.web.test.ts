/**
 * @jest-environment jsdom
 */
import type { Auth, User } from 'firebase/auth';

import { FirebaseAuthService } from '../FirebaseAuthService.web';

const mockSignInWithPhoneNumber = jest.fn();
const mockSignOut = jest.fn();
const mockRecaptchaClear = jest.fn();
let mockAuthStateListener: (user: Partial<User> | null) => void = () => {};

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, listener: (user: unknown) => void) => {
    mockAuthStateListener = listener;
    return () => {};
  },
  signInWithPhoneNumber: (...args: unknown[]) => mockSignInWithPhoneNumber(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  RecaptchaVerifier: jest.fn().mockImplementation(() => ({ clear: mockRecaptchaClear })),
}));

const firebaseUser = { uid: 'uid-1', phoneNumber: '+972501234567', email: null };

function setup(currentUser: { getIdToken: () => Promise<string> } | null = null) {
  const auth = { currentUser } as unknown as Auth;
  return { service: new FirebaseAuthService(auth), auth };
}

describe('FirebaseAuthService (web)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is not ready until Firebase has restored the session', () => {
    const { service } = setup();
    const listener = jest.fn();
    service.onAuthStateChanged(listener);

    expect(service.isReady()).toBe(false);
    expect(service.getCurrentUser()).toBeNull();

    mockAuthStateListener(firebaseUser);

    expect(service.isReady()).toBe(true);
    expect(service.getCurrentUser()).toEqual({
      id: 'uid-1',
      phoneNumber: '+972501234567',
      email: null,
    });
    expect(listener).toHaveBeenLastCalledWith(service.getCurrentUser());
  });

  it('sends the code with an invisible reCAPTCHA and confirms it', async () => {
    const confirm = jest.fn().mockResolvedValue({ user: firebaseUser });
    mockSignInWithPhoneNumber.mockResolvedValue({ confirm });
    const { service, auth } = setup();

    const verification = await service.startPhoneSignIn('+972501234567');

    expect(mockSignInWithPhoneNumber).toHaveBeenCalledWith(
      auth,
      '+972501234567',
      expect.anything(),
    );
    expect(mockRecaptchaClear).toHaveBeenCalled();
    expect(document.body.children).toHaveLength(0);
    await expect(verification.confirm('123456')).resolves.toMatchObject({ id: 'uid-1' });
    expect(confirm).toHaveBeenCalledWith('123456');
  });

  it('cleans up the reCAPTCHA when sending fails, so the user can retry', async () => {
    mockSignInWithPhoneNumber.mockRejectedValue(new Error('auth/invalid-phone-number'));
    const { service } = setup();

    await expect(service.startPhoneSignIn('+1555')).rejects.toThrow('auth/invalid-phone-number');
    expect(mockRecaptchaClear).toHaveBeenCalled();
    expect(document.body.children).toHaveLength(0);
  });

  it('returns the Firebase ID token for the API, or null when signed out', async () => {
    expect(await setup().service.getIdToken()).toBeNull();

    const signedIn = setup({ getIdToken: async () => 'firebase-id-token' });
    expect(await signedIn.service.getIdToken()).toBe('firebase-id-token');
  });

  it('signs out through Firebase', async () => {
    const { service, auth } = setup();
    await service.signOut();

    expect(mockSignOut).toHaveBeenCalledWith(auth);
  });
});
