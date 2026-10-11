import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useServices } from '@/services/ServicesProvider';

/**
 * Listings matching `query` (case-insensitive substring, like `ILIKE '%query%'`). Disabled for an
 * empty query. Keyed under 'products' so publishing a listing refreshes search results too.
 */
export function useSearchProducts(query: string) {
  const { products } = useServices();
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['products', 'search', trimmed.toLocaleLowerCase()],
    queryFn: () => products.searchProducts(trimmed),
    enabled: trimmed.length > 0,
    // Keep showing the previous results while the next search loads (no flicker while typing).
    placeholderData: keepPreviousData,
  });
}
