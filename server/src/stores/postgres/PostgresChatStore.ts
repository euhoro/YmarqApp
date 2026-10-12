import { and, asc, desc, eq, gt, inArray, or, sql } from 'drizzle-orm';

import {
  compareConversations,
  type ChatStore,
  type Conversation,
  type Message,
  type MessageCursor,
  type NewConversation,
  type NewMessage,
} from '../ChatStore.js';
import type { PostgresDatabase } from './PostgresProductStore.js';
import { conversations, messages } from './schema.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ConversationRow = typeof conversations.$inferSelect;
type MessageRow = typeof messages.$inferSelect;

const toMessage = ({ createdAt, ...row }: MessageRow): Message => ({ ...row, sentAt: createdAt });

const toConversation = (row: ConversationRow, last: MessageRow | undefined): Conversation => {
  const lastMessage = last ? toMessage(last) : null;
  return { ...row, lastMessage, updatedAt: lastMessage?.sentAt ?? row.createdAt };
};

export class PostgresChatStore implements ChatStore {
  constructor(private readonly db: PostgresDatabase) {}

  async openConversation(input: NewConversation) {
    // Timestamps are set here (millisecond precision) so they round-trip exactly through JS Dates.
    const [inserted] = await this.db
      .insert(conversations)
      .values({ ...input, createdAt: new Date() })
      .onConflictDoNothing({ target: [conversations.productId, conversations.buyerId] })
      .returning();
    if (inserted) return { conversation: toConversation(inserted, undefined), created: true };

    const [existing] = await this.db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.productId, input.productId), eq(conversations.buyerId, input.buyerId)),
      );
    const [withLast] = await this.attachLastMessages([existing!]);
    return { conversation: withLast!, created: false };
  }

  async getConversation(id: string): Promise<Conversation | null> {
    if (!UUID.test(id)) return null;
    const [row] = await this.db.select().from(conversations).where(eq(conversations.id, id));
    if (!row) return null;
    const [conversation] = await this.attachLastMessages([row]);
    return conversation!;
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const rows = await this.db
      .select()
      .from(conversations)
      .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)));
    return (await this.attachLastMessages(rows)).sort(compareConversations);
  }

  async getMessage(id: string): Promise<Message | null> {
    if (!UUID.test(id)) return null;
    const [row] = await this.db.select().from(messages).where(eq(messages.id, id));
    return row ? toMessage(row) : null;
  }

  async listMessages(conversationId: string, after?: MessageCursor): Promise<Message[]> {
    if (!UUID.test(conversationId)) return [];
    const afterCursor = !after
      ? undefined
      : after.id
        ? sql`(${messages.createdAt}, ${messages.id}) > (${after.sentAt.toISOString()}::timestamptz, ${after.id}::uuid)`
        : gt(messages.createdAt, after.sentAt);
    const rows = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.conversationId, conversationId), afterCursor))
      .orderBy(asc(messages.createdAt), asc(messages.id));
    return rows.map(toMessage);
  }

  async addMessage(input: NewMessage): Promise<Message> {
    const [row] = await this.db
      .insert(messages)
      .values({ ...input, createdAt: new Date() })
      .returning();
    return toMessage(row!);
  }

  /** Adds each conversation's newest message, in one query (`DISTINCT ON`). */
  private async attachLastMessages(rows: ConversationRow[]): Promise<Conversation[]> {
    if (rows.length === 0) return [];
    const latest = await this.db
      .selectDistinctOn([messages.conversationId])
      .from(messages)
      .where(
        inArray(
          messages.conversationId,
          rows.map((row) => row.id),
        ),
      )
      .orderBy(messages.conversationId, desc(messages.createdAt), desc(messages.id));
    const byConversation = new Map(latest.map((message) => [message.conversationId, message]));
    return rows.map((row) => toConversation(row, byConversation.get(row.id)));
  }
}
