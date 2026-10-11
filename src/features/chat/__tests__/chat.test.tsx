import { QueryClient } from '@tanstack/react-query';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import FeedScreen from '@/app/(app)/index';
import ConversationRoute from '@/app/(app)/chats/[id]';
import InboxRoute from '@/app/(app)/chats/index';
import NewConversationRoute from '@/app/(app)/chats/new';
import ListingRoute from '@/app/(app)/listing/[id]';
import { AppProviders } from '@/providers/AppProviders';
import { FakeAuthService } from '@/services/auth/FakeAuthService';
import { FakeChatRepository } from '@/services/chat/FakeChatRepository';
import { FakeProductRepository } from '@/services/products/FakeProductRepository';

import { formatChatTime } from '../formatChatTime';

const MACBOOK_ID = '3c9f1e52-8a41-4f0b-9d2e-6b7a1c5d8e01'; // sold by Dana
const RECORD_PLAYER_ID = '5d2e8f71-3b6a-4c9d-8e1f-2a4b6c8d0e12'; // sold by Yossi

function setup() {
  const auth = new FakeAuthService();
  const products = new FakeProductRepository();
  const chat = new FakeChatRepository(auth, products, { replyDelayMs: null });
  return { auth, products, chat };
}

function renderApp(initialUrl: string, services = setup()) {
  return renderRouter(
    {
      index: FeedScreen,
      'listing/[id]': ListingRoute,
      'chats/index': InboxRoute,
      'chats/[id]': ConversationRoute,
      'chats/new': NewConversationRoute,
    },
    {
      initialUrl,
      wrapper: ({ children }) => (
        <AppProviders
          services={services}
          queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
          {children}
        </AppProviders>
      ),
    },
  );
}

describe('chat', () => {
  it('"Message <seller>" on a listing opens a new conversation', async () => {
    const services = setup();
    const app = renderApp(`/listing/${MACBOOK_ID}`, services);
    await app;

    await fireEvent.press(await screen.findByRole('button', { name: /Message Dana/ }));

    const [conversation] = await waitFor(async () => {
      const list = await services.chat.listConversations();
      expect(list).toHaveLength(1);
      return list;
    });
    await waitFor(() => expect(app.getPathname()).toBe(`/chats/${conversation.id}`));
    expect(await screen.findByText('Say hello and ask about the item.')).toBeTruthy();
    expect(await screen.findByText('MacBook Air 13", like new')).toBeTruthy();
  });

  it('opening the same listing again reuses the conversation', async () => {
    const services = setup();
    const existing = await services.chat.startConversation(MACBOOK_ID);
    await services.chat.sendMessage(existing.id, 'Still available?');

    const app = renderApp(`/chats/new?productId=${MACBOOK_ID}`, services);
    await app;

    await waitFor(() => expect(app.getPathname()).toBe(`/chats/${existing.id}`));
    expect(await screen.findByText('Still available?')).toBeTruthy();
    expect(await services.chat.listConversations()).toHaveLength(1);
  });

  it('sending a message shows it in the conversation', async () => {
    const services = setup();
    const { id } = await services.chat.startConversation(MACBOOK_ID);
    const app = renderApp(`/chats/${id}`, services);
    await app;

    const input = await screen.findByLabelText('Message text');
    await fireEvent.changeText(input, 'Is it still available?');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Is it still available?')).toBeTruthy();
    await waitFor(() => expect(screen.getByLabelText('Message text').props.value).toBe(''));
    expect((await services.chat.listMessages(id)).map((m) => m.text)).toEqual([
      'Is it still available?',
    ]);
  });

  it('the inbox lists conversations newest first, with the other person and last message', async () => {
    const services = setup();
    const macbook = await services.chat.startConversation(MACBOOK_ID);
    const recordPlayer = await services.chat.startConversation(RECORD_PLAYER_ID);
    await services.chat.sendMessage(recordPlayer.id, 'Does it play 78s?');
    await services.chat.sendMessage(macbook.id, 'Is the battery OK?');

    const app = renderApp('/chats', services);
    await app;

    expect(await screen.findByText('Dana · MacBook Air 13", like new')).toBeTruthy();
    expect(await screen.findByText('Yossi · Record player, works great')).toBeTruthy();
    expect(screen.getByText('You: Is the battery OK?')).toBeTruthy();
    const titles = screen.getAllByText(/ · /).map((title) => title.props.children);
    expect(titles).toEqual([
      'Dana · MacBook Air 13", like new',
      'Yossi · Record player, works great',
    ]);

    await fireEvent.press(screen.getByTestId(`conversation-${recordPlayer.id}`));
    await waitFor(() => expect(app.getPathname()).toBe(`/chats/${recordPlayer.id}`));
    expect(await screen.findByText('Does it play 78s?')).toBeTruthy();
  });

  // The feed's "Messages" header button is covered by e2e/smoke.spec.ts: the native-stack header
  // isn't rendered in Jest.
  it('an empty inbox explains how to start a chat', async () => {
    const app = renderApp('/chats');
    await app;

    expect(await screen.findByText('No messages yet')).toBeTruthy();
    expect(screen.getByText('Open a listing and message the seller.')).toBeTruthy();
  });
});

describe('formatChatTime', () => {
  const now = new Date(2026, 9, 11, 18, 0);

  it('shows the time for today and the date otherwise', () => {
    expect(formatChatTime(new Date(2026, 9, 11, 9, 5).toISOString(), now)).toBe('09:05');
    expect(formatChatTime(new Date(2026, 9, 3, 9, 5).toISOString(), now)).toBe('3 Oct');
    expect(formatChatTime(new Date(2025, 0, 3).toISOString(), now)).toBe('3 Jan 2025');
  });
});
