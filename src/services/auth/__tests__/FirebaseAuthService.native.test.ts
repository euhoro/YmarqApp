import type { Auth, User } from '@react-native-firebase/auth';

import { AuthError } from '../AuthService';
import { FirebaseAuthService } from '../FirebaseAuthService.native';

const mockSignInWithPhoneNumber = jest.fn();
const mockSignOut = jest.fn();
let mockAuthStateListener: (user: Partial<User> | null) => void = () => {};

jest.mock('@react-native-firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, listener: (user: unknown) => void) => {
    mockAuthStateListener = listener;
    return () => {};
  },
  signInWithPhoneNumber: (...args: unknown[]) => mockSignInWithPhoneNumber(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  getIdToken: (user: { token: string }) => Promise.resolve(user.token),
}));

const firebaseUser = { uid: 'uid-1', phoneNumber: '+972501234567', email: null };

function setup(currentUser: { token: string } | null = null) {
  const auth = { currentUser } as unknown as Auth;
  return { service: new FirebaseAuthService(auth), auth };
}

describe('FirebaseAuthService (iOS/Android)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('is not ready until the native SDK has restored the session', () => {
    const { service } = setup();
    const listener = jest.fn();
    service.onAuthStateChanged(listener);
    expect(service.isReady()).toBe(false);

    mockAuthStateListener(firebaseUser);

    expect(service.isReady()).toBe(true);
    expect(service.getCurrentUser()).toEqual({
      id: 'uid-1',
      phoneNumber: '+972501234567',
      email: null,
    });
    expect(listener).toHaveBeenLastCalledWith(service.getCurrentUser());
  });

  it('sends the code without a web reCAPTCHA and confirms it', async () => {
    const confirm = jest.fn().mockResolvedValue({ user: firebaseUser });
    mockSignInWithPhoneNumber.mockResolvedValue({ confirm });
    const { service, auth } = setup();

    const verification = await service.startPhoneSignIn('+972501234567');

    expect(mockSignInWithPhoneNumber).toHaveBeenCalledWith(auth, '+972501234567');
    await expect(verification.confirm('123456')).resolves.toMatchObject({ id: 'uid-1' });
    expect(confirm).toHaveBeenCalledWith('123456');
  });

  it('explains known Firebase errors, and a wrong code', async () => {
    mockSignInWithPhoneNumber.mockRejectedValueOnce(
      Object.assign(new Error('[auth/too-many-requests]'), { code: 'auth/too-many-requests' }),
    );
    const { service } = setup();

    const failure = service.startPhoneSignIn('+16505551234');
    await expect(failure).rejects.toBeInstanceOf(AuthError);
    await expect(failure).rejects.toThrow(/Too many attempts/);

    const confirm = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/invalid-verification-code' }));
    mockSignInWithPhoneNumber.mockResolvedValue({ confirm });
    const verification = await service.startPhoneSignIn('+16505551234');
    await expect(verification.confirm('000000')).rejects.toThrow(/Wrong code/);
  });

  it('returns the Firebase ID token for the API, or null when signed out', async () => {
    expect(await setup().service.getIdToken()).toBeNull();
    expect(await setup({ token: 'firebase-id-token' }).service.getIdToken()).toBe(
      'firebase-id-token',
    );
  });

  it('signs out through Firebase', async () => {
    const { service, auth } = setup();
    await service.signOut();
    expect(mockSignOut).toHaveBeenCalledWith(auth);
  });
});
