/** Returns the bearer token for the signed-in user, or null when signed out. */
export type TokenProvider = () => Promise<string | null>;

/** A non-2xx answer from the Ymarq API; `message` is the server's `{ error }` text. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Calls the Ymarq API (`server/`) as the signed-in user. Shared by every API repository. */
export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: TokenProvider,
    // Wrapped: browsers throw "Illegal invocation" when fetch is called as a method of another object.
    private readonly fetchFn: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  /** The parsed JSON body (null for empty answers such as 204). Throws ApiError when not 2xx. */
  async request(path: string, options: { method?: string; body?: unknown } = {}): Promise<unknown> {
    const token = await this.getToken();
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        json && typeof json === 'object' && 'error' in json
          ? String(json.error)
          : response.statusText;
      throw new ApiError(response.status, message || `HTTP ${response.status}`);
    }
    return json;
  }

  /** Like `request`, but answers null instead of throwing for the given statuses (e.g. 404). */
  async requestOrNull(path: string, nullFor: number[] = [404]): Promise<unknown> {
    try {
      return await this.request(path);
    } catch (error) {
      if (error instanceof ApiError && nullFor.includes(error.status)) return null;
      throw error;
    }
  }
}
