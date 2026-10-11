import { useQuery } from '@tanstack/react-query';

import { useServices } from '@/services/ServicesProvider';

/** One listing (`data` is null when it doesn't exist). Keyed under 'products' so edits refresh it. */
export function useProduct(id: string | undefined) {
  const { products } = useServices();
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => products.getProduct(id!),
    enabled: Boolean(id),
  });
}

/** The display name of a user, or null if they have no profile. */
export function useDisplayName(userId: string | null) {
  const { profiles } = useServices();
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profiles.getProfile(userId!),
    enabled: Boolean(userId),
    select: (profile) => profile?.displayName ?? null,
  });
}
