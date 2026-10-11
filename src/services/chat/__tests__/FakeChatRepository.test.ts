import { DEMO_USER, FakeAuthService } from '../../auth/FakeAuthService';
import { FakeProductRepository } from '../../products/FakeProductRepository';
import { otherParticipant } from '../ChatRepository';
import { FakeChatRepository, SCRIPTED_SELLER_REPLY } from '../FakeChatRepository';

const MACBOOK_ID = '3c9f1e52-8a41-4f0b-9d2e-6b7a1c5d8e01'; // sold by demo-dana
const RECORD_PLAYER_ID = '5d2e8f71-3b6a-4c9d-8e1f-2a4b6c8d0e12'; // sold by demo-yossi

function setup(replyDelayMs: number | null = null) {
  const auth = new FakeAuthService();
  const products = new FakeProductRepository();
  const chat = new FakeChatRepository(auth, products, { replyDelayMs });
  return { auth, products, chat };
}

describe('FakeChatRepository', () => {
  afterEach(() => jest.useRealTimers());

  it('starts a conversation between the buyer and the seller', async () => {
    const { chat } = setup();
    const conversation = await chat.startConversation(MACBOOK_ID);

    expect(conversation).toMatchObject({
      productId: MACBOOK_ID,
      buyerId: DEMO_USER.id,
      sellerId: 'demo-dana',
      lastMessage: null,
    });
    expect(otherParticipant(conversation, DEMO_USER.id)).toBe('demo-dana');
    expect(await chat.listMessages(conversation.id)).toEqual([]);
  });

  it('reuses the conversation for the same listing and buyer, even when started twice at once', async () => {
    const { chat } = setup();
    const [a, b] = await Promise.all([
      chat.startConversation(MACBOOK_ID),
      chat.startConversation(MACBOOK_ID),
    ]);
    const c = await chat.startConversation(MACBOOK_ID);

    expect(b.id).toBe(a.id);
    expect(c.id).toBe(a.id);
    expect(await chat.listConversations()).toHaveLength(1);
  });

  it('refuses to start a chat about your own or a missing listing', async () => {
    const { chat, products } = setup();
    const own = await products.createProduct({
      description: 'My lamp',
      hashtag: '',
      imageUrl: null,
      publisherId: DEMO_USER.id,
      price: null,
      currency: null,
      category: null,
      location: null,
    });
    await expect(chat.startConversation(own.id)).rejects.toThrow("can't message yourself");
    await expect(chat.startConversation('nope')).rejects.toThrow('not available');
  });

  it('sends messages in order and shows the last one on the conversation', async () => {
    const { chat } = setup();
    const { id } = await chat.startConversation(MACBOOK_ID);

    await chat.sendMessage(id, '  Is it still available?  ');
    await chat.sendMessage(id, 'Can I see it tomorrow?');

    const messages = await chat.listMessages(id);
    expect(messages.map((m) => m.text)).toEqual([
      'Is it still available?',
      'Can I see it tomorrow?',
    ]);
    expect(messages.every((m) => m.senderId === DEMO_USER.id)).toBe(true);
    expect((await chat.getConversation(id))?.lastMessage?.text).toBe('Can I see it tomorrow?');
    await expect(chat.sendMessage(id, '   ')).rejects.toThrow('empty');
  });

  it('lists conversations newest activity first', async () => {
    const { chat } = setup();
    const macbook = await chat.startConversation(MACBOOK_ID);
    const recordPlayer = await chat.startConversation(RECORD_PLAYER_ID);
    expect((await chat.listConversations()).map((c) => c.id)).toEqual([
      recordPlayer.id,
      macbook.id,
    ]);

    await chat.sendMessage(macbook.id, 'Hi');
    expect((await chat.listConversations()).map((c) => c.id)).toEqual([
      macbook.id,
      recordPlayer.id,
    ]);
  });

  it('the seller replies once, shortly after the first message', async () => {
    jest.useFakeTimers();
    const { chat } = setup(1500);
    const { id } = await chat.startConversation(MACBOOK_ID);

    await chat.sendMessage(id, 'Hi!');
    expect(await chat.listMessages(id)).toHaveLength(1);

    jest.advanceTimersByTime(1500);
    const messages = await chat.listMessages(id);
    expect(messages.map((m) => [m.senderId, m.text])).toEqual([
      [DEMO_USER.id, 'Hi!'],
      ['demo-dana', SCRIPTED_SELLER_REPLY],
    ]);

    await chat.sendMessage(id, 'Great');
    jest.advanceTimersByTime(5000);
    expect(await chat.listMessages(id)).toHaveLength(3);
  });

  it('only shows a conversation to its participants', async () => {
    const { auth, chat } = setup();
    const { id } = await chat.startConversation(MACBOOK_ID);

    await auth.signOut();
    const verification = await auth.startPhoneSignIn('+972501234567');
    await verification.confirm('123456');

    expect(await chat.listConversations()).toEqual([]);
    expect(await chat.getConversation(id)).toBeNull();
    await expect(chat.sendMessage(id, 'hi')).rejects.toThrow('not found');
  });
});
