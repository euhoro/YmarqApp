import type { Category, Currency } from '@/domain/product';

/** Fields suggested from a free-text listing description. Anything not found is null/empty. */
export interface ExtractedListing {
  price: number | null;
  currency: Currency | null;
  category: Category | null;
  location: string | null;
  hashtag: string;
}

/**
 * Turns "Selling my Suzuki Swift, 25,000 ₪, Tel Aviv" into structured fields.
 * Today: RuleBasedExtractor (on device). Later: a smarter service behind the same interface (#52).
 */
export interface ListingExtractor {
  extract(text: string): ExtractedListing;
}
