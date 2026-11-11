import type { LiveFlight } from "@weems/contrats";
import { type ReceivedEvent, streamSse } from "../../apps/api/src/testing/sse-client.ts";
import type { Histogram } from "./histogram.ts";

/** Real ms at which each position was first sent, by flight then sequence number. */
type SentLog = ReadonlyMap<string, ReadonlyMap<number, number>>;

/**
 * One spectator of the live map. For every position a pilot sent, measures when this
 * spectator first saw it or a newer one (criterion 2). Positions sent before the
 * spectator connected are not counted.
 */
export class Viewer {
  private readonly lastSeen = new Map<string, number>();
  /** Flights taken off the map (closed): their last positions are rightly never shown. */
  private readonly removed = new Set<string>();
  private readonly connection: ReturnType<typeof streamSse>;
  private readonly sent: SentLog;
  private readonly delays: Histogram;

  constructor(url: string, sent: SentLog, delays: Histogram) {
    this.sent = sent;
    this.delays = delays;
    this.connection = streamSse(url, (event) => this.receive(event));
  }

  /** Positions sent more than `graceMs` ago that this spectator never saw. */
  missed(nowMs: number, graceMs: number): number {
    let missed = 0;
    for (const [flightId, sentAt] of this.sent) {
      if (this.removed.has(flightId)) continue;
      const seen = this.lastSeen.get(flightId) ?? 0;
      for (const [seq, atMs] of sentAt) if (seq > seen && atMs < nowMs - graceMs) missed += 1;
    }
    return missed;
  }

  close(): Promise<void> {
    return this.connection.close();
  }

  private receive({ event, data, receivedAtMs }: ReceivedEvent): void {
    if (event !== "snapshot" && event !== "update") return;
    const { flights, removed = [] } = data as { flights: LiveFlight[]; removed?: string[] };
    for (const flightId of removed) this.removed.add(flightId);
    for (const flight of flights) {
      const previous = this.lastSeen.get(flight.flightId);
      const seq = flight.position.seq;
      if (event === "update") this.measure(flight.flightId, previous ?? 0, seq, receivedAtMs);
      this.lastSeen.set(flight.flightId, Math.max(previous ?? 0, seq));
    }
  }

  private measure(flightId: string, after: number, upTo: number, receivedAtMs: number): void {
    const sentAt = this.sent.get(flightId);
    if (!sentAt) return;
    for (let seq = after + 1; seq <= upTo; seq++) {
      const atMs = sentAt.get(seq);
      if (atMs !== undefined) this.delays.add(receivedAtMs - atMs);
    }
  }
}
