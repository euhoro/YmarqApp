import type { ListingExtractor } from './ListingExtractor';
import { RuleBasedExtractor } from './RuleBasedExtractor';

export type { ExtractedListing, ListingExtractor } from './ListingExtractor';

/** Rule-based today; the extraction service (#52) plugs in here. */
export const listingExtractor: ListingExtractor = new RuleBasedExtractor();
