import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { NewProduct } from '@/domain/product';
import { useServices } from '@/services/ServicesProvider';

/** Publishes a listing and refreshes every product list. */
export function useCreateListing() {
  const { products } = useServices();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewProduct) => products.createProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
