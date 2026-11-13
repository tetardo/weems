import type { ServerResponse } from "node:http";
import type { Boarding } from "@weems/contrats";
import { SseChannel, sseMessage } from "./sse-channel.ts";

/** Same pace as the live map's batches: the boards follow the flights without delay. */
const CHECK_EVERY_MS = 2_000;

/** What says whether the boards changed: everything but the time they were built. */
const contentOf = (board: Boarding) => JSON.stringify([board.departures, board.arrivals]);

/**
 * Server-sent events of the page Boarding (spec web Boarding): the whole boards on connection,
 * then again, as event "board", every time they change (checked every 2 s). Nothing is built
 * while nobody watches. The boards are built and serialised once for every spectator.
 */
export class BoardingStream {
  private readonly channel = new SseChannel();
  private readonly read: () => Boarding;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastSent: string | null = null;

  constructor(read: () => Boarding) {
    this.read = read;
  }

  get clientCount(): number {
    return this.channel.size;
  }

  connect(client: ServerResponse): void {
    this.channel.open(client, sseMessage("board", this.read()));
  }

  start(): void {
    this.timer = setInterval(() => this.tick(), CHECK_EVERY_MS);
    this.channel.start();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.channel.stop();
  }

  tick(): void {
    if (this.channel.size === 0) {
      this.lastSent = null;
      return;
    }
    const board = this.read();
    const content = contentOf(board);
    if (content === this.lastSent) return;
    this.lastSent = content;
    this.channel.send(sseMessage("board", board));
  }
}
