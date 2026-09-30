import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { FakeAuthService } from '@/services/auth/FakeAuthService';
import type { ProductRepository } from '@/services/products';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';
import { ServicesProvider } from '@/services/ServicesProvider';

import { useProducts } from '../useProducts';

function setup(products: ProductRepository, auth = new FakeAuthService()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ServicesProvider services={{ auth, products }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ServicesProvider>
  );
  return renderHook(() => useProducts(), { wrapper });
}

describe('useProducts', () => {
  it("loads the signed-in user's products", async () => {
    const repo = new FakeProductRepository();
    const spy = jest.spyOn(repo, 'listProducts');

    const { result } = await setup(repo);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].description).toBe('Suzuki Swift');
    expect(spy).toHaveBeenCalledWith('1111111111');
  });

  it('exposes repository errors', async () => {
    const repo: ProductRepository = {
      listProducts: jest.fn().mockRejectedValue(new Error('Server down')),
    };

    const { result } = await setup(repo);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server down');
  });

  it('does not fetch while signed out', async () => {
    const repo = new FakeProductRepository();
    const spy = jest.spyOn(repo, 'listProducts');

    const { result } = await setup(repo, new FakeAuthService(null));

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it('refetch() calls the repository again', async () => {
    const repo = new FakeProductRepository();
    const spy = jest.spyOn(repo, 'listProducts');

    const { result } = await setup(repo);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await result.current.refetch();
    });

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
