import { promisify } from "node:util";
import { gzip } from "node:zlib";

const gzipAsync = promisify(gzip);

/** Bodies above this size leave gzip-compressed (trajectories, fiche 021); smaller ones as is. */
const COMPRESS_FROM_BYTES = 32 * 1024;

/** A slow upload (about 400 kbit/s) gets one more second per 50 KB sent, not a fixed timeout. */
const SLOW_UPLOAD_BYTES_PER_S = 50_000;

/** The request body, compressed when worth it, with its headers. */
async function encodedBody(
  body: unknown,
): Promise<{ data: string | Buffer; headers: Record<string, string> }> {
  const json = JSON.stringify(body);
  if (Buffer.byteLength(json) < COMPRESS_FROM_BYTES) return { data: json, headers: {} };
  return { data: await gzipAsync(json), headers: { "content-encoding": "gzip" } };
}

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
      const encoded = await encodedBody(body);
      const response = await fetch(new URL(path, options.baseUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "weems-client": `tracker/${options.trackerVersion}`,
          ...encoded.headers,
        },
        body: encoded.data,
        signal: AbortSignal.timeout(
          (options.timeoutMs ?? 10_000) +
            Math.ceil(encoded.data.length / SLOW_UPLOAD_BYTES_PER_S) * 1000,
        ),
      });
      await response.body?.cancel();
      return { status: response.status };
    },
  };
}
