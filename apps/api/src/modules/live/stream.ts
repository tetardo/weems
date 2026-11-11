import type { ServerResponse } from "node:http";
import type { LiveBoard } from "./live-board.ts";

const BATCH_EVERY_MS = 2_000;
const HEARTBEAT_EVERY_MS = 15_000;

function write(client: ServerResponse, event: string, data: unknown): void {
  client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

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
    write(client, "snapshot", this.board.snapshot());
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
    if (update) this.clients.forEach((client) => write(client, "update", update));
  }

  private heartbeat(): void {
    this.clients.forEach((client) => client.write(": heartbeat\n\n"));
  }
}
