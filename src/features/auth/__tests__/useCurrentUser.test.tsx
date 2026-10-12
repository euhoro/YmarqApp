import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { DEMO_USER, FakeAuthService } from '@/services/auth/FakeAuthService';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';
import { ServicesProvider } from '@/services/ServicesProvider';

import { useAuthReady, useCurrentUser } from '../useCurrentUser';

describe('useCurrentUser', () => {
  it('returns the current user and follows sign-out', async () => {
    const auth = new FakeAuthService();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ServicesProvider services={{ auth, products: new FakeProductRepository() }}>
        {children}
      </ServicesProvider>
    );

    const { result } = await renderHook(() => useCurrentUser(), { wrapper });
    expect(result.current).toEqual(DEMO_USER);

    await act(() => auth.signOut());
    expect(result.current).toBeNull();
  });
});

describe('useAuthReady', () => {
  it('follows the service until the saved session is restored', async () => {
    class SlowAuth extends FakeAuthService {
      ready = false;
      isReady() {
        return this.ready;
      }
      async restore() {
        this.ready = true;
        await this.signOut(); // notifies listeners
      }
    }
    const auth = new SlowAuth();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ServicesProvider services={{ auth, products: new FakeProductRepository() }}>
        {children}
      </ServicesProvider>
    );

    const { result } = await renderHook(() => useAuthReady(), { wrapper });
    expect(result.current).toBe(false);

    await act(() => auth.restore());
    expect(result.current).toBe(true);
  });
});
