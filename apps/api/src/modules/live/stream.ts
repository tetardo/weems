import type { ServerResponse } from "node:http";
import type { LiveBoard } from "./live-board.ts";
import { SseChannel, sseMessage } from "./sse-channel.ts";

const BATCH_EVERY_MS = 2_000;

/**
 * Server-sent events to browsers (spec J1, part 3): a snapshot on connection,
 * then position batches every 2 s, and a heartbeat every 15 s to keep the connection open.
 */
export class LiveStream {
  private readonly channel = new SseChannel();
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly board: LiveBoard;
  private readonly onError: (error: unknown) => void;

  /** `onError`: a failed read of the pilots (the batch still leaves, with the pilots known). */
  constructor(board: LiveBoard, onError: (error: unknown) => void = () => undefined) {
    this.board = board;
    this.onError = onError;
  }

  get clientCount(): number {
    return this.channel.size;
  }

  connect(client: ServerResponse): void {
    this.channel.open(client, sseMessage("snapshot", this.board.snapshot()));
  }

  start(): void {
    this.timer = setInterval(() => void this.tick(), BATCH_EVERY_MS);
    this.channel.start();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.channel.stop();
  }

  /** Pilots first, so that a batch already carries a pilot who just appeared or left. */
  async tick(): Promise<void> {
    try {
      await this.board.refreshPilots();
    } catch (error) {
      // Database unavailable: the batch leaves without fresh pilots; the next tick tries again.
      this.onError(error);
    }
    this.broadcastUpdate();
  }

  broadcastUpdate(): void {
    const update = this.board.takeUpdate();
    // Serialised once for every spectator, not once per spectator (spec J4, H1).
    if (update) this.channel.send(sseMessage("update", update));
  }
}
