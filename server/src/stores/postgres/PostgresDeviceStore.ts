import { and, asc, eq, inArray, lt } from 'drizzle-orm';

import type { Device, DeviceStore, PushTicket } from '../DeviceStore.js';
import type { PostgresDatabase } from './PostgresProductStore.js';
import { devices, pushTickets } from './schema.js';

export class PostgresDeviceStore implements DeviceStore {
  constructor(private readonly db: PostgresDatabase) {}

  async register(userId: string, token: string): Promise<Device> {
    // Timestamps are set here (millisecond precision) so they round-trip exactly through JS Dates.
    const updatedAt = new Date();
    const [device] = await this.db
      .insert(devices)
      .values({ token, userId, updatedAt })
      .onConflictDoUpdate({ target: devices.token, set: { userId, updatedAt } })
      .returning();
    return device!;
  }

  async unregister(userId: string, token: string): Promise<boolean> {
    const deleted = await this.db
      .delete(devices)
      .where(and(eq(devices.token, token), eq(devices.userId, userId)))
      .returning({ token: devices.token });
    return deleted.length > 0;
  }

  async listForUsers(userIds: readonly string[]): Promise<Device[]> {
    if (userIds.length === 0) return [];
    return this.db
      .select()
      .from(devices)
      .where(inArray(devices.userId, [...userIds]));
  }

  async remove(tokens: readonly string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.db.delete(devices).where(inArray(devices.token, [...tokens]));
  }

  async addTickets(tickets: readonly { id: string; token: string }[], createdAt: Date) {
    if (tickets.length === 0) return;
    await this.db
      .insert(pushTickets)
      .values(tickets.map(({ id, token }) => ({ id, token, createdAt })))
      .onConflictDoNothing();
  }

  async takeTickets(before: Date, limit: number): Promise<PushTicket[]> {
    const due = this.db
      .select({ id: pushTickets.id })
      .from(pushTickets)
      .where(lt(pushTickets.createdAt, before))
      .orderBy(asc(pushTickets.createdAt), asc(pushTickets.id))
      .limit(limit);
    // Delete-and-return in one statement, so two concurrent callers never take the same ticket.
    const taken = await this.db.delete(pushTickets).where(inArray(pushTickets.id, due)).returning();
    return taken.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
