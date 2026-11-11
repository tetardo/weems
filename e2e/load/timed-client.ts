import type { ApiClient } from "../../apps/tracker/src/sender/api-client.ts";
import { Histogram } from "./histogram.ts";

const POSITION_PATH = /^\/v1\/flights\/[^/]+\/positions$/;

/** Wraps the tracker's API client to time the position requests (criterion 3). */
export class TimedClient implements ApiClient {
  readonly positionResponseMs = new Histogram();
  /** Position requests answered with an error status, or that failed on the network. */
  positionFailures = 0;
  private readonly inner: ApiClient;

  constructor(inner: ApiClient) {
    this.inner = inner;
  }

  async post(path: string, body: unknown): Promise<{ status: number }> {
    if (!POSITION_PATH.test(path)) return this.inner.post(path, body);
    const startedAt = performance.now();
    try {
      const response = await this.inner.post(path, body);
      if (response.status >= 300) this.positionFailures += 1;
      return response;
    } catch (error) {
      this.positionFailures += 1;
      throw error;
    } finally {
      this.positionResponseMs.add(performance.now() - startedAt);
    }
  }
}
