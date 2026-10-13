import { ApiClient, ApiError } from '../api/ApiClient';
import { ApiChatRepository } from '../chat/ApiChatRepository';
import { ApiProfileRepository } from '../profile/ApiProfileRepository';
import { ApiSavedSearchRepository } from '../saved-searches/ApiSavedSearchRepository';

const BASE = 'https://ymarq-app-api.vercel.app';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  } as Response;
}

function setup(...responses: Response[]) {
  const fetchFn = jest.fn();
  responses.forEach((r) => fetchFn.mockResolvedValueOnce(r));
  const client = new ApiClient(BASE, async () => 'firebase-token', fetchFn);
  const call = (n: number) => {
    const [url, init] = fetchFn.mock.calls[n] as [string, RequestInit];
    return {
      url,
      method: init.method,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
  };
  return { client, fetchFn, call };
}

const MESSAGE = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'avi',
  text: 'Is it still available?',
  sentAt: '2026-10-12T07:00:01.234Z',
};
const CONVERSATION = {
  id: 'c1',
  productId: 'p1',
  buyerId: 'avi',
  sellerId: 'dana',
  lastMessage: MESSAGE,
  createdAt: '2026-10-12T07:00:00.000Z',
  updatedAt: '2026-10-12T07:00:01.234Z',
};

describe('ApiClient', () => {
  it("sends the bearer token and throws the server's error message", async () => {
    const { client, fetchFn } = setup(response({ error: 'Sign in required' }, 401));

    const failure = client.request('/v1/me');

    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ status: 401, message: 'Sign in required' });
    expect(fetchFn.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer firebase-token' });
  });
});

describe('ApiProfileRepository', () => {
  it('reads public profiles and maps 404 to null', async () => {
    const { client, call } = setup(
      response({ id: 'dana', displayName: 'Dana' }),
      response({ error: 'User not found' }, 404),
    );
    const repo = new ApiProfileRepository(client);

    expect(await repo.getProfile('phone:+972 1')).toEqual({ userId: 'dana', displayName: 'Dana' });
    expect(call(0).url).toBe(`${BASE}/v1/users/phone%3A%2B972%201`);
    expect(await repo.getProfile('nobody')).toBeNull();
  });

  it('saves only the display name to /v1/me', async () => {
    const { client, call } = setup(
      response({ id: 'uid', displayName: 'Dana', phoneNumber: '+972501234567' }),
    );

    const saved = await new ApiProfileRepository(client).saveProfile({
      userId: 'ignored',
      displayName: 'Dana',
    });

    expect(saved).toEqual({ userId: 'uid', displayName: 'Dana' });
    expect(call(0)).toEqual({ url: `${BASE}/v1/me`, method: 'PUT', body: { displayName: 'Dana' } });
  });

  it('passes other errors through', async () => {
    const { client } = setup(response({ error: 'Internal server error' }, 500));

    await expect(new ApiProfileRepository(client).getProfile('dana')).rejects.toMatchObject({
      status: 500,
    });
  });
});

describe('ApiChatRepository', () => {
  it('starts a conversation about a listing', async () => {
    const { client, call } = setup(response(CONVERSATION, 201));

    const conversation = await new ApiChatRepository(client).startConversation('p1');

    expect(conversation).toEqual({
      id: 'c1',
      productId: 'p1',
      buyerId: 'avi',
      sellerId: 'dana',
      lastMessage: MESSAGE,
      updatedAt: CONVERSATION.updatedAt,
    });
    expect(call(0)).toEqual({
      url: `${BASE}/v1/conversations`,
      method: 'POST',
      body: { productId: 'p1' },
    });
  });

  it('lists conversations and messages, and sends messages', async () => {
    const { client, call } = setup(
      response([CONVERSATION]),
      response([MESSAGE]),
      response(MESSAGE, 201),
    );
    const repo = new ApiChatRepository(client);

    expect(await repo.listConversations()).toHaveLength(1);
    expect(await repo.listMessages('c1')).toEqual([MESSAGE]);
    expect(call(1).url).toBe(`${BASE}/v1/conversations/c1/messages`);
    expect(await repo.sendMessage('c1', 'Is it still available?')).toEqual(MESSAGE);
    expect(call(2)).toEqual({
      url: `${BASE}/v1/conversations/c1/messages`,
      method: 'POST',
      body: { text: 'Is it still available?' },
    });
  });

  it("treats someone else's or a missing conversation as not found", async () => {
    const { client } = setup(
      response({ error: 'Forbidden' }, 403),
      response({ error: 'Not found' }, 404),
    );
    const repo = new ApiChatRepository(client);

    expect(await repo.getConversation('c1')).toBeNull();
    expect(await repo.getConversation('c2')).toBeNull();
  });
});

describe('ApiSavedSearchRepository', () => {
  const SEARCH = {
    id: 's1',
    userId: 'avi',
    query: 'bike',
    createdAt: '2026-10-12T07:00:00.000Z',
  };

  it('lists and saves searches, sending the trimmed query', async () => {
    const { client, call } = setup(response([SEARCH]), response(SEARCH, 201));
    const repo = new ApiSavedSearchRepository(client);

    expect(await repo.listSavedSearches()).toEqual([SEARCH]);
    expect(call(0)).toEqual({ url: `${BASE}/v1/saved-searches`, method: 'GET', body: undefined });
    expect(await repo.saveSearch('  bike ')).toEqual(SEARCH);
    expect(call(1)).toEqual({
      url: `${BASE}/v1/saved-searches`,
      method: 'POST',
      body: { query: 'bike' },
    });
  });

  it('rejects an empty query without calling the server', async () => {
    const { client, fetchFn } = setup();

    await expect(new ApiSavedSearchRepository(client).saveSearch('   ')).rejects.toThrow(
      'Type something to search for first.',
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('deletes a search and ignores one that is already gone', async () => {
    const { client, call } = setup(
      response(null, 204),
      response({ error: 'Saved search not found' }, 404),
      response({ error: 'Internal server error' }, 500),
    );
    const repo = new ApiSavedSearchRepository(client);

    await repo.deleteSavedSearch('s 1');
    expect(call(0)).toEqual({
      url: `${BASE}/v1/saved-searches/s%201`,
      method: 'DELETE',
      body: undefined,
    });
    await expect(repo.deleteSavedSearch('s2')).resolves.toBeUndefined();
    await expect(repo.deleteSavedSearch('s3')).rejects.toMatchObject({ status: 500 });
  });
});
