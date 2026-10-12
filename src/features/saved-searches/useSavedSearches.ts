import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useServices } from '@/services/ServicesProvider';

const KEY = ['savedSearches'] as const;

/** The signed-in user's saved searches ("alerts"), newest first. */
export function useSavedSearches() {
  const { savedSearches } = useServices();
  const user = useCurrentUser();
  return useQuery({
    queryKey: [...KEY, user?.id],
    queryFn: () => savedSearches.listSavedSearches(),
    enabled: user !== null,
  });
}

/** Saves a search (returns the existing one if the same query is already saved). */
export function useSaveSearch() {
  const { savedSearches } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (query: string) => savedSearches.saveSearch(query),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSavedSearch() {
  const { savedSearches } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savedSearches.deleteSavedSearch(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
