import { useSyncExternalStore } from 'react';

import type { AuthUser } from '@/domain/user';
import { useServices } from '@/services/ServicesProvider';

/** The signed-in user (or null), re-rendering whenever the auth state changes. */
export function useCurrentUser(): AuthUser | null {
  const { auth } = useServices();
  return useSyncExternalStore(
    (onChange) => auth.onAuthStateChanged(onChange),
    () => auth.getCurrentUser(),
  );
}

/** False while the saved session is still being restored after a reload. */
export function useAuthReady(): boolean {
  const { auth } = useServices();
  return useSyncExternalStore(
    (onChange) => auth.onAuthStateChanged(onChange),
    () => auth.isReady(),
  );
}
