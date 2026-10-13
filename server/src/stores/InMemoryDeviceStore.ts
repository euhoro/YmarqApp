import type { Device, DeviceStore, PushTicket } from './DeviceStore.js';

export class InMemoryDeviceStore implements DeviceStore {
  private devices = new Map<string, Device>();
  private tickets: PushTicket[] = [];

  async register(userId: string, token: string): Promise<Device> {
    const device: Device = { token, userId, updatedAt: new Date() };
    this.devices.set(token, device);
    return device;
  }

  async unregister(userId: string, token: string): Promise<boolean> {
    if (this.devices.get(token)?.userId !== userId) return false;
    return this.devices.delete(token);
  }

  async listForUsers(userIds: readonly string[]): Promise<Device[]> {
    return [...this.devices.values()].filter((d) => userIds.includes(d.userId));
  }

  async remove(tokens: readonly string[]): Promise<void> {
    tokens.forEach((token) => this.devices.delete(token));
  }

  async addTickets(tickets: readonly { id: string; token: string }[], createdAt: Date) {
    this.tickets.push(...tickets.map(({ id, token }) => ({ id, token, createdAt })));
  }

  async takeTickets(before: Date, limit: number): Promise<PushTicket[]> {
    const taken = this.tickets
      .filter((t) => t.createdAt < before)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit);
    this.tickets = this.tickets.filter((t) => !taken.includes(t));
    return taken;
  }
}
