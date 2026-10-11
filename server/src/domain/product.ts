import { z } from 'zod';

/** A listing as the API stores it. The app's domain `Product` has the same fields. */
export interface Product {
  id: string;
  publisherId: string;
  description: string;
  hashtag: string;
  imageUrl: string | null;
  price: number | null;
  currency: 'ILS' | 'USD' | 'EUR' | null;
  category: string | null;
  location: string | null;
  createdAt: Date;
}

export const NewProductSchema = z.object({
  description: z.string().trim().min(3).max(300),
  hashtag: z.string().trim().max(200).default(''),
  imageUrl: z.string().url().nullable().default(null),
  price: z.number().nonnegative().nullable().default(null),
  currency: z.enum(['ILS', 'USD', 'EUR']).nullable().default(null),
  category: z.string().trim().max(50).nullable().default(null),
  location: z.string().trim().max(100).nullable().default(null),
});

export type NewProduct = z.infer<typeof NewProductSchema> & { publisherId: string };

/**
 * The 2014 wire format (`GET /photos/GetProducts/{userCode}`), kept so the app's legacy data source
 * works against this API unchanged.
 */
export function toLegacyProduct(product: Product) {
  return {
    Id: product.id,
    Description: product.description,
    Hashtag: product.hashtag,
    Image: product.imageUrl ?? '',
    PublisherId: product.publisherId,
    Price: product.price,
    Currency: product.currency,
    Category: product.category,
    Location: product.location,
  };
}
