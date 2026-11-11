import type { ApiClient } from "../../apps/tracker/src/sender/api-client.ts";

const POSITION_PATH = /^\/v1\/flights\/([^/]+)\/positions$/;

/**
 * Wraps the tracker's API client to observe what it sends: when each position left,
 * which ones the API accepted. Can also cut the network, like an unreachable API.
 */
export class RecordingClient implements ApiClient {
  /** Real ms at which each position was first sent, by flight then sequence number. */
  readonly sentAtMs = new Map<string, Map<number, number>>();
  /** Positions accepted by the API (2xx), by flight. */
  readonly accepted = new Map<string, Set<number>>();
  private cutUntilMs = 0;
  private readonly inner: ApiClient;

  constructor(inner: ApiClient) {
    this.inner = inner;
  }

  /** Every request fails as if the network were down, for `durationMs`. */
  cut(durationMs: number): void {
    this.cutUntilMs = Date.now() + durationMs;
  }

  async post(path: string, body: unknown): Promise<{ status: number }> {
    if (Date.now() < this.cutUntilMs) throw new TypeError("fetch failed (simulated outage)");
    const flightId = POSITION_PATH.exec(path)?.[1];
    const seq = flightId ? (body as { seq: number }).seq : 0;
    if (flightId) this.noteSent(flightId, seq);
    const response = await this.inner.post(path, body);
    if (flightId && response.status < 300) this.noteAccepted(flightId, seq);
    return response;
  }

  private noteSent(flightId: string, seq: number): void {
    const sent = this.sentAtMs.get(flightId) ?? new Map<number, number>();
    if (!sent.has(seq)) sent.set(seq, Date.now());
    this.sentAtMs.set(flightId, sent);
  }

  private noteAccepted(flightId: string, seq: number): void {
    const accepted = this.accepted.get(flightId) ?? new Set<number>();
    accepted.add(seq);
    this.accepted.set(flightId, accepted);
  }
}
