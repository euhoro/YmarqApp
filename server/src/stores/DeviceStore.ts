/** A phone that receives push notifications for `userId` through its Expo push token. */
export interface Device {
  token: string;
  userId: string;
  updatedAt: Date;
}

/** A sent push whose delivery receipt Expo will have ready later (about 15 minutes). */
export interface PushTicket {
  /** Expo's receipt id. */
  id: string;
  token: string;
  createdAt: Date;
}

/**
 * Push tokens of users' phones, and the receipts still to check. Implementations:
 * InMemoryDeviceStore (tests, local dev) and PostgresDeviceStore. Every implementation must pass
 * `__tests__/deviceStoreContract.ts`.
 */
export interface DeviceStore {
  /**
   * Registers `token` for `userId`. A token belongs to one phone, so if another user registered
   * it (someone else signed in on that phone), it moves to `userId`.
   */
  register(userId: string, token: string): Promise<Device>;
  /** Removes the user's token (sign-out). False when the user has no such token. */
  unregister(userId: string, token: string): Promise<boolean>;
  /** The devices of these users. */
  listForUsers(userIds: readonly string[]): Promise<Device[]>;
  /** Removes tokens Expo reported as no longer registered, whoever they belong to. */
  remove(tokens: readonly string[]): Promise<void>;
  /** Remembers receipts of pushes sent at `createdAt`, to check later (`takeTickets`). */
  addTickets(tickets: readonly { id: string; token: string }[], createdAt: Date): Promise<void>;
  /** Removes and returns up to `limit` tickets created before `before`, oldest first. */
  takeTickets(before: Date, limit: number): Promise<PushTicket[]>;
}
