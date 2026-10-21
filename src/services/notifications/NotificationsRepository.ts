/** Which phones get the signed-in user's push notifications. */
export interface NotificationsRepository {
  /** Sends this phone's push token to the server, for the signed-in user. */
  registerDevice(token: string): Promise<void>;
  /** Stops pushes to this phone (before signing out). */
  unregisterDevice(token: string): Promise<void>;
}
