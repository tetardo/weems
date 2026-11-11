import type { ServerResponse } from "node:http";
import type { LiveBoard } from "./live-board.ts";

const BATCH_EVERY_MS = 2_000;
const HEARTBEAT_EVERY_MS = 15_000;
/**
 * A spectator this far behind (a sleeping tab, a weak mobile link) is cut off:
 * otherwise the API keeps every batch it could not send (spec J4, H2).
 * The browser reconnects by itself and gets a fresh snapshot.
 */
export const MAX_BUFFERED_BYTES = 1024 * 1024;

const sseMessage = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * Server-sent events to browsers (spec J1, part 3): a snapshot on connection,
 * then position batches every 2 s, and a heartbeat every 15 s to keep the connection open.
 */
export class LiveStream {
  private readonly clients = new Set<ServerResponse>();
  private readonly timers: ReturnType<typeof setInterval>[] = [];
  private readonly board: LiveBoard;

  constructor(board: LiveBoard) {
    this.board = board;
  }

  get clientCount(): number {
    return this.clients.size;
  }

  connect(client: ServerResponse): void {
    client.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      // Public stream at J1: the map page is served by the web app from another port.
      "access-control-allow-origin": "*",
    });
    client.write(sseMessage("snapshot", this.board.snapshot()));
    this.clients.add(client);
    client.on("close", () => this.clients.delete(client));
  }

  start(): void {
    this.timers.push(setInterval(() => this.broadcastUpdate(), BATCH_EVERY_MS));
    this.timers.push(setInterval(() => this.heartbeat(), HEARTBEAT_EVERY_MS));
  }

  stop(): void {
    this.timers.forEach(clearInterval);
    this.clients.forEach((client) => client.end());
    this.clients.clear();
  }

  broadcastUpdate(): void {
    const update = this.board.takeUpdate();
    // Serialised once for every spectator, not once per spectator (spec J4, H1).
    if (update) this.send(sseMessage("update", update));
  }

  private heartbeat(): void {
    this.send(": heartbeat\n\n");
  }

  private send(message: string): void {
    for (const client of this.clients) {
      if (client.writableLength > MAX_BUFFERED_BYTES) {
        this.clients.delete(client);
        client.destroy();
      } else client.write(message);
    }
  }
}
