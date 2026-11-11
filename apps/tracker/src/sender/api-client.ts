/** Minimal HTTP access to the Weems API; injected so tests can use the real API in-process. */
export interface ApiClient {
  /** Never throws for an HTTP status; throws only when the network fails. */
  post(path: string, body: unknown): Promise<{ status: number }>;
}

export interface HttpApiClientOptions {
  baseUrl: string;
  token: string;
  trackerVersion: string;
  /** ms before a request is abandoned. */
  timeoutMs?: number;
}

export function httpApiClient(options: HttpApiClientOptions): ApiClient {
  return {
    async post(path, body) {
      const response = await fetch(new URL(path, options.baseUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${options.token}`,
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
