const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Visitors of the live map (page Activité simulée): each one holds the SSE stream open and
 * reads it, as a browser would, and reconnects if it drops. They show nowhere on the site:
 * they only load the API.
 */
export class Visitors {
  private connected = 0;
  private readonly controller = new AbortController();
  private readonly running: Promise<void>[] = [];

  constructor(streamUrl: string, count: number, rampMs: number) {
    for (let i = 0; i < count; i++) {
      this.running.push(this.visit(streamUrl, (i * rampMs) / Math.max(1, count)));
    }
  }

  get count(): number {
    return this.connected;
  }

  async stop(): Promise<void> {
    this.controller.abort();
    await Promise.all(this.running);
  }

  private async visit(url: string, delayMs: number): Promise<void> {
    await wait(delayMs);
    while (!this.controller.signal.aborted) {
      try {
        await this.watch(url);
      } catch {
        // Stopped, or the API is down: try again shortly.
      }
      if (!this.controller.signal.aborted) await wait(2000);
    }
  }

  /** One connection, until it drops or the visitors stop. */
  private async watch(url: string): Promise<void> {
    const response = await fetch(url, { signal: this.controller.signal });
    this.connected++;
    try {
      for await (const _chunk of response.body ?? []) {
        // Read and dropped: the visitor only keeps the stream flowing.
      }
    } finally {
      this.connected--;
    }
  }
}
