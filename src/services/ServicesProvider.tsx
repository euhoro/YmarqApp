import { createContext, useContext, useState, type ReactNode } from 'react';

import { createAuthService, type AuthService } from './auth';
import { createProductRepository, type ProductRepository } from './products';
import { createProfileRepository, type ProfileRepository } from './profile';

export interface Services {
  auth: AuthService;
  products: ProductRepository;
  profiles: ProfileRepository;
}

export function createServices(): Services {
  return {
    auth: createAuthService(),
    products: createProductRepository(),
    profiles: createProfileRepository(),
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
  const [value] = useState<Services>(() => ({ ...createServices(), ...services }));
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>.');
  return services;
}
