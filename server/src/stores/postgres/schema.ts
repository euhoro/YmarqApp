import { index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Listings. Column names are snake_case; the API maps them to the camelCase `Product`. */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publisherId: text('publisher_id').notNull(),
    description: text('description').notNull(),
    hashtag: text('hashtag').notNull().default(''),
    imageUrl: text('image_url'),
    price: numeric('price', { mode: 'number' }),
    currency: text('currency'),
    category: text('category'),
    location: text('location'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_created_at_idx').on(table.createdAt),
    index('products_publisher_id_idx').on(table.publisherId),
  ],
);
