import { z } from 'zod';

/**
 * The exact product shape served by the legacy backend
 * (`GET /photos/GetProducts/{userCode}`), PascalCase and all.
 * Firestore documents use the same field names, so any data source can be
 * parsed with this one schema.
 */
export const LegacyProductSchema = z.object({
  Id: z.string(),
  Description: z.string(),
  Hashtag: z.string(),
  Image: z.string().nullish(),
  PublisherId: z.string().nullish(),
});

export type LegacyProduct = z.infer<typeof LegacyProductSchema>;

/** The product as the app uses it. */
export interface Product {
  id: string;
  description: string;
  hashtag: string;
  imageUrl: string | null;
  publisherId: string | null;
}

export function toProduct(legacy: LegacyProduct): Product {
  return {
    id: legacy.Id,
    description: legacy.Description,
    hashtag: legacy.Hashtag,
    imageUrl: legacy.Image || null,
    publisherId: legacy.PublisherId || null,
  };
}

/** Parses an untrusted legacy payload (a JSON array of products). Throws on malformed data. */
export function parseLegacyProducts(json: unknown): Product[] {
  return z.array(LegacyProductSchema).parse(json).map(toProduct);
}
