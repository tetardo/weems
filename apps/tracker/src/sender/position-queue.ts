import type { PositionReport } from "@weems/contrats";
import type { ApiClient } from "./api-client.ts";
import { actionFor } from "./retry.ts";

/** Positions older than this are dropped, except the newest of each flight (spec J1, part 2). */
const MAX_AGE_MS = 30_000;

/**
 * Live positions: kept in memory only (never in the outbox), sent in order once the flight's
 * opening has been accepted, so that none is lost on a healthy network (J1 criterion 2).
 */
export class PositionQueue {
  private readonly queues = new Map<string, PositionReport[]>();
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  push(flightId: string, report: PositionReport): void {
    const queue = this.queues.get(flightId) ?? [];
    queue.push(report);
    this.queues.set(flightId, queue);
  }

  /** Sends what can be sent. `canSend` says whether the flight is known to the API yet. */
  async flush(nowMs: number, canSend: (flightId: string) => boolean): Promise<void> {
    for (const [flightId, queue] of this.queues) {
      if (!canSend(flightId)) continue;
      this.dropStale(queue, nowMs);
      await this.sendInOrder(flightId, queue);
      if (queue.length === 0) this.queues.delete(flightId);
    }
  }

  private dropStale(queue: PositionReport[], nowMs: number): void {
    while (queue.length > 1 && nowMs - Date.parse(queue[0]?.at ?? "") > MAX_AGE_MS) queue.shift();
  }

  /** Stops at the first failure; what is left is tried again at the next flush. */
  private async sendInOrder(flightId: string, queue: PositionReport[]): Promise<void> {
    while (queue.length > 0) {
      const report = queue[0];
      let action;
      try {
        const { status } = await this.api.post(`/v1/flights/${flightId}/positions`, report);
        action = actionFor(status);
      } catch {
        action = "retry" as const;
      }
      if (action === "retry") return;
      queue.shift(); // accepted, or refused for good (4xx): never re-sent in a loop
    }
  }
}
