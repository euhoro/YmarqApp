import { z } from 'zod';

/**
 * The exact product shape served by the legacy backend
 * (`GET /photos/GetProducts/{userCode}`), PascalCase and all.
 * Every data source uses these field names, so one schema parses them all.
 * 2026-10-05: optional Price, Currency, Category and Location were added; older payloads without them
 * still parse.
 */
export const LegacyProductSchema = z.object({
  Id: z.string(),
  Description: z.string(),
  Hashtag: z.string(),
  Image: z.string().nullish(),
  PublisherId: z.string().nullish(),
  Price: z.number().nullish(),
  Currency: z.enum(['ILS', 'USD', 'EUR']).nullish(),
  Category: z.string().nullish(),
  Location: z.string().nullish(),
});

export const CURRENCIES = ['ILS', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const CURRENCY_SYMBOLS: Record<Currency, string> = { ILS: '₪', USD: '$', EUR: '€' };

export const CATEGORIES = [
  'Vehicles',
  'Electronics',
  'Furniture',
  'Home',
  'Fashion',
  'Sports',
  'Kids',
  'Books',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type LegacyProduct = z.infer<typeof LegacyProductSchema>;

/** The product as the app uses it. */
export interface Product {
  id: string;
  description: string;
  hashtag: string;
  imageUrl: string | null;
  publisherId: string | null;
  price: number | null;
  currency: Currency | null;
  category: string | null;
  location: string | null;
}

/** What a seller provides when publishing; the repository assigns the id. */
export interface NewProduct {
  description: string;
  hashtag: string;
  imageUrl: string | null;
  publisherId: string;
  price: number | null;
  currency: Currency | null;
  category: string | null;
  location: string | null;
}

export function toProduct(legacy: LegacyProduct): Product {
  return {
    id: legacy.Id,
    description: legacy.Description,
    hashtag: legacy.Hashtag,
    imageUrl: legacy.Image || null,
    publisherId: legacy.PublisherId || null,
    price: legacy.Price ?? null,
    currency: legacy.Currency ?? null,
    category: legacy.Category || null,
    location: legacy.Location || null,
  };
}

/** "₪25,000", or null when there is no price. */
export function formatPrice(product: Pick<Product, 'price' | 'currency'>): string | null {
  if (product.price === null) return null;
  const symbol = CURRENCY_SYMBOLS[product.currency ?? 'ILS'];
  return `${symbol}${product.price.toLocaleString('en-US')}`;
}

/** Parses an untrusted legacy payload (a JSON array of products). Throws on malformed data. */
export function parseLegacyProducts(json: unknown): Product[] {
  return z.array(LegacyProductSchema).parse(json).map(toProduct);
}
