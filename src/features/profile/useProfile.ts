import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useServices } from '@/services/ServicesProvider';

/** The signed-in user's profile (`data` is null until they register a name). */
export function useProfile() {
  const { profiles } = useServices();
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profiles.getProfile(user!.id),
    enabled: user !== null,
  });
}

export function useSaveProfile() {
  const { profiles } = useServices();
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) => profiles.saveProfile({ userId: user!.id, displayName }),
    onSuccess: (profile) => queryClient.setQueryData(['profile', profile.userId], profile),
  });
}
