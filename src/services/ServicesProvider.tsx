import { createContext, useContext, useState, type ReactNode } from 'react';

import { createAuthService, type AuthService } from './auth';
import { createProductRepository, type ProductRepository } from './products';

export interface Services {
  auth: AuthService;
  products: ProductRepository;
}

export function createServices(): Services {
  return { auth: createAuthService(), products: createProductRepository() };
}

const ServicesContext = createContext<Services | null>(null);

/** Provides the app's services. Tests pass their own `services` (fakes) to it. */
export function ServicesProvider({
  services,
  children,
}: {
  services?: Services;
  children: ReactNode;
}) {
  const [value] = useState(() => services ?? createServices());
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>.');
  return services;
}
