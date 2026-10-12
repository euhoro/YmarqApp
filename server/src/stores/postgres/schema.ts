import { index, numeric, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

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

// --- Chat (#49) ---

/** A buyer talking to a seller about one listing; one per (product, buyer). */
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // No foreign key: the chat history stays if the listing is deleted.
    productId: uuid('product_id').notNull(),
    buyerId: text('buyer_id').notNull(),
    sellerId: text('seller_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('conversations_product_buyer_unique').on(table.productId, table.buyerId),
    index('conversations_buyer_id_idx').on(table.buyerId),
    index('conversations_seller_id_idx').on(table.sellerId),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: text('sender_id').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('messages_conversation_created_at_idx').on(table.conversationId, table.createdAt),
  ],
);
