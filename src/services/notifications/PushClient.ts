/** Whether the user lets the app show notifications. `undetermined`: we may still ask. */
export type PushPermission = 'granted' | 'denied' | 'undetermined';

/** The phone's notification system (expo-notifications on iOS/Android; unsupported on web). */
export interface PushClient {
  /** False where push isn't available (web). The other methods are not called then. */
  readonly isSupported: boolean;
  getPermission(): Promise<PushPermission>;
  /** Shows the system permission prompt (when the system still allows asking). */
  requestPermission(): Promise<PushPermission>;
  /** This phone's Expo push token. Throws when the build can't receive push (e.g. no credentials). */
  getToken(): Promise<string>;
  /**
   * Calls `listener` with the `url` of every tapped notification, including the one that opened
   * the app. Returns an unsubscribe function.
   */
  onOpenUrl(listener: (url: string) => void): () => void;
}
