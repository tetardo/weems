/** Minimal HTTP access to the Weems API; injected so tests can use the real API in-process. */
export interface ApiClient {
  /** Never throws for an HTTP status; throws only when the network fails. */
  post(path: string, body: unknown): Promise<{ status: number }>;
}

export interface HttpApiClientOptions {
  baseUrl: string;
  /**
   * Fixed token (development: `dev-token`), or the pilot's access token, read before each request.
   * Null: nobody is logged in, answered as a 401 without calling the API.
   */
  token: string | (() => Promise<string | null>);
  trackerVersion: string;
  /** ms before a request is abandoned. */
  timeoutMs?: number;
}

export function httpApiClient(options: HttpApiClientOptions): ApiClient {
  return {
    async post(path, body) {
      const token = typeof options.token === "string" ? options.token : await options.token();
      if (token === null) return { status: 401 };
      const response = await fetch(new URL(path, options.baseUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "weems-client": `tracker/${options.trackerVersion}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
      });
      await response.body?.cancel();
      return { status: response.status };
    },
  };
}
