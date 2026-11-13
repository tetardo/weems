import type { ServerResponse } from "node:http";

const HEARTBEAT_EVERY_MS = 15_000;
/**
 * A spectator this far behind (a sleeping tab, a weak mobile link) is cut off:
 * otherwise the API keeps every message it could not send (spec J4, H2).
 * The browser reconnects by itself and gets a fresh first message.
 */
export const MAX_BUFFERED_BYTES = 1024 * 1024;

export const sseMessage = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * The spectators of one server-sent events stream: opens their connection with a first message,
 * sends every message to all of them, and a heartbeat every 15 s to keep the connections open.
 */
export class SseChannel {
  private readonly clients = new Set<ServerResponse>();
  private heartbeat: ReturnType<typeof setInterval> | null = null;

  get size(): number {
    return this.clients.size;
  }

  open(client: ServerResponse, first: string): void {
    client.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      // Public streams: the pages are served by the web app from another port.
      "access-control-allow-origin": "*",
    });
    client.write(first);
    this.clients.add(client);
    client.on("close", () => this.clients.delete(client));
  }

  start(): void {
    this.heartbeat = setInterval(() => this.send(": heartbeat\n\n"), HEARTBEAT_EVERY_MS);
  }

  stop(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
    this.clients.forEach((client) => client.end());
    this.clients.clear();
  }

  /** `message` is serialised once by the caller, whatever the number of spectators (spec J4, H1). */
  send(message: string): void {
    for (const client of this.clients) {
      if (client.writableLength > MAX_BUFFERED_BYTES) {
        this.clients.delete(client);
        client.destroy();
      } else client.write(message);
    }
  }
}
