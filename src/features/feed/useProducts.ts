import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useServices } from '@/services/ServicesProvider';

/** The signed-in user's products. Disabled (no request) while signed out. */
export function useProducts() {
  const { products } = useServices();
  const user = useCurrentUser();

  return useQuery({
    queryKey: ['products', user?.id],
    queryFn: () => products.listProducts(user!.id),
    enabled: user !== null,
  });
}
