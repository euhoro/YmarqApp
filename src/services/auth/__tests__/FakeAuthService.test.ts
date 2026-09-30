import { DEMO_USER, FAKE_SMS_CODE, FakeAuthService } from '../FakeAuthService';

describe('FakeAuthService', () => {
  it('starts signed in as the legacy demo user', () => {
    expect(new FakeAuthService().getCurrentUser()).toEqual(DEMO_USER);
  });

  it('signs in with a phone number and the fake code, notifying listeners', async () => {
    const auth = new FakeAuthService(null);
    const listener = jest.fn();
    auth.onAuthStateChanged(listener);

    const verification = await auth.startPhoneSignIn('+972501234567');
    await expect(verification.confirm('000000')).rejects.toThrow();
    const user = await verification.confirm(FAKE_SMS_CODE);

    expect(user.phoneNumber).toBe('+972501234567');
    expect(listener).toHaveBeenLastCalledWith(user);
  });

  it('signs out', async () => {
    const auth = new FakeAuthService();
    const listener = jest.fn();
    const unsubscribe = auth.onAuthStateChanged(listener);

    await auth.signOut();
    unsubscribe();

    expect(auth.getCurrentUser()).toBeNull();
    expect(listener).toHaveBeenLastCalledWith(null);
  });
});
