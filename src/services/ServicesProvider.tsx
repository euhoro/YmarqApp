import { createContext, useContext, useState, type ReactNode } from 'react';

import { createAuthService, type AuthService } from './auth';
import { createChatRepository, type ChatRepository } from './chat';
import { createProductRepository, type ProductRepository } from './products';
import { createProfileRepository, type ProfileRepository } from './profile';

export interface Services {
  auth: AuthService;
  products: ProductRepository;
  profiles: ProfileRepository;
  chat: ChatRepository;
}

/** The default services, with any `overrides` used instead (and by the services built on them). */
export function createServices(overrides: Partial<Services> = {}): Services {
  const auth = overrides.auth ?? createAuthService();
  const products =
    overrides.products ?? createProductRepository(undefined, () => auth.getIdToken());
  return {
    auth,
    products,
    profiles: overrides.profiles ?? createProfileRepository(),
    chat: overrides.chat ?? createChatRepository(auth, products),
  };
}

const ServicesContext = createContext<Services | null>(null);

/**
 * Provides the app's services. Tests pass the fakes they care about; anything left out gets the
 * default implementation, so adding a new service doesn't break existing tests.
 */
export function ServicesProvider({
  services,
  children,
}: {
  services?: Partial<Services>;
  children: ReactNode;
}) {
  const [value] = useState<Services>(() => createServices(services));
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>.');
  return services;
}
