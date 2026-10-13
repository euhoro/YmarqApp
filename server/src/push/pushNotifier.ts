import type { ExpoPushMessage, ExpoPushReceipt, ExpoPushTicket } from 'expo-server-sdk';

import type { ListingMatchedEvent } from '../matching/listingMatched.js';
import type { MessageCreatedEvent } from '../routes/chat.js';
import type { DeviceStore } from '../stores/DeviceStore.js';
import type { ProfileStore } from '../stores/ProfileStore.js';

/** The parts of `Expo` (expo-server-sdk) the notifier uses; tests pass a fake. */
export interface ExpoPushClient {
  sendPushNotificationsAsync(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]>;
  getPushNotificationReceiptsAsync(ids: string[]): Promise<{ [id: string]: ExpoPushReceipt }>;
  chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][];
  chunkPushNotificationReceiptIds(ids: string[]): string[][];
}

/** Expo has receipts ready about 15 minutes after sending, and keeps them for a day. */
const RECEIPT_DELAY_MS = 15 * 60 * 1000;
const RECEIPTS_PER_CHECK = 1000;
const BODY_MAX = 150;

interface Push {
  userId: string;
  title: string;
  body: string;
  /** Read by the app when the notification is tapped; `url` is the screen to open. */
  data: Record<string, string>;
}

const truncate = (text: string) =>
  text.length > BODY_MAX ? `${text.slice(0, BODY_MAX - 1).trimEnd()}…` : text;

const isDeadToken = (result: ExpoPushTicket | ExpoPushReceipt) =>
  result.status === 'error' && result.details?.error === 'DeviceNotRegistered';

export interface PushNotifierDeps {
  devices: DeviceStore;
  profiles: ProfileStore;
  expo: ExpoPushClient;
  now?: () => Date;
}

/**
 * Sends push notifications for `message.created` (to the recipient) and `listing.matched` (to each
 * user whose saved search matched), never to the user who caused the event. Tokens Expo reports as
 * no longer registered are removed: right away from send tickets, and from delivery receipts,
 * which are checked on later sends once they are ready.
 */
export function createPushNotifier({
  devices,
  profiles,
  expo,
  now = () => new Date(),
}: PushNotifierDeps) {
  async function send(pushes: Push[]): Promise<void> {
    const found = await devices.listForUsers([...new Set(pushes.map((p) => p.userId))]);
    const messages: ExpoPushMessage[] = pushes.flatMap(({ userId, title, body, data }) =>
      found
        .filter((device) => device.userId === userId)
        .map((device) => ({ to: device.token, title, body, data, sound: 'default' })),
    );

    const dead: string[] = [];
    const pending: { id: string; token: string }[] = [];
    for (const chunk of expo.chunkPushNotifications(messages)) {
      // Expo answers with one ticket per message, in order.
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        const token = chunk[i]!.to as string;
        if (ticket.status === 'ok') pending.push({ id: ticket.id, token });
        else if (isDeadToken(ticket)) dead.push(token);
        else console.error('push failed', ticket.message);
      });
    }
    await devices.remove(dead);
    await devices.addTickets(pending, now());
    await checkReceipts();
  }

  /** Removes the tokens of receipts that say the app was uninstalled or the token expired. */
  async function checkReceipts(): Promise<void> {
    try {
      const due = await devices.takeTickets(
        new Date(now().getTime() - RECEIPT_DELAY_MS),
        RECEIPTS_PER_CHECK,
      );
      const tokenById = new Map(due.map((t) => [t.id, t.token]));
      const dead: string[] = [];
      for (const ids of expo.chunkPushNotificationReceiptIds([...tokenById.keys()])) {
        const receipts = await expo.getPushNotificationReceiptsAsync(ids);
        for (const [id, receipt] of Object.entries(receipts)) {
          if (isDeadToken(receipt)) dead.push(tokenById.get(id)!);
        }
      }
      await devices.remove(dead);
    } catch (error) {
      // Receipts are housekeeping; a failure here must not hide that the pushes went out.
      console.error('push receipts check failed', error);
    }
  }

  async function onMessageCreated({ message, recipientId }: MessageCreatedEvent): Promise<void> {
    if (recipientId === message.senderId) return;
    const sender = await profiles.get(message.senderId);
    await send([
      {
        userId: recipientId,
        title: sender?.displayName ?? 'New message',
        body: truncate(message.text),
        data: {
          type: 'message.created',
          conversationId: message.conversationId,
          url: `/chats/${message.conversationId}`,
        },
      },
    ]);
  }

  async function onListingMatched({ product, matches }: ListingMatchedEvent): Promise<void> {
    // One push per user, even when several of their saved searches match.
    const firstMatchByUser = new Map<string, string>();
    for (const { userId, query } of matches) {
      if (userId !== product.publisherId && !firstMatchByUser.has(userId)) {
        firstMatchByUser.set(userId, query);
      }
    }
    await send(
      [...firstMatchByUser].map(([userId, query]) => ({
        userId,
        title: `New listing for “${query}”`,
        body: truncate(product.description),
        data: { type: 'listing.matched', productId: product.id, url: `/listing/${product.id}` },
      })),
    );
  }

  return { onMessageCreated, onListingMatched, checkReceipts };
}
