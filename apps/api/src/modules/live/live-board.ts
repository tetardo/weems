import type { LiveFlight, LiveSnapshot, LiveUpdate, PositionReport } from "@weems/contrats";
import type { LiveFeed, LiveFlightInfo } from "../flights/live-feed.ts";

/** Spec J1, part 3: "signal perdu" after 60 s, off the map after 10 min without news. */
const LOST_AFTER_MS = 60_000;
const REMOVED_AFTER_MS = 10 * 60_000;

interface Entry {
  info: LiveFlightInfo;
  position: PositionReport;
  receivedAtMs: number;
  signal: LiveFlight["signal"];
}

/**
 * State of the live map: the last position of each open flight, in memory
 * (architecture, step 2). Collects changes until the stream takes them every 2 s.
 */
export class LiveBoard implements LiveFeed {
  private readonly entries = new Map<string, Entry>();
  private changed = new Set<string>();
  private removed = new Set<string>();
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  lastPosition(flightId: string): PositionReport | undefined {
    return this.entries.get(flightId)?.position;
  }

  position(info: LiveFlightInfo, report: PositionReport): void {
    this.entries.set(info.flightId, {
      info,
      position: report,
      receivedAtMs: this.now(),
      signal: "ok",
    });
    this.changed.add(info.flightId);
    this.removed.delete(info.flightId);
  }

  closed(flightId: string): void {
    if (this.entries.delete(flightId)) this.markRemoved(flightId);
  }

  snapshot(): LiveSnapshot {
    return { flights: [...this.entries.values()].map(toLiveFlight) };
  }

  /** Changes since the last call, after applying the silence rules. null when nothing changed. */
  takeUpdate(): LiveUpdate | null {
    this.sweep();
    if (this.changed.size === 0 && this.removed.size === 0) return null;
    const flights = [...this.changed].flatMap((id) => {
      const entry = this.entries.get(id);
      return entry ? [toLiveFlight(entry)] : [];
    });
    const update = { flights, removed: [...this.removed] };
    this.changed = new Set();
    this.removed = new Set();
    return update;
  }

  private sweep(): void {
    const now = this.now();
    for (const [id, entry] of this.entries) {
      const silentMs = now - entry.receivedAtMs;
      if (silentMs > REMOVED_AFTER_MS) {
        this.entries.delete(id);
        this.markRemoved(id);
      } else if (silentMs > LOST_AFTER_MS && entry.signal === "ok") {
        entry.signal = "lost";
        this.changed.add(id);
      }
    }
  }

  private markRemoved(flightId: string): void {
    this.changed.delete(flightId);
    this.removed.add(flightId);
  }
}

function toLiveFlight(entry: Entry): LiveFlight {
  return {
    ...entry.info,
    position: entry.position,
    receivedAt: new Date(entry.receivedAtMs).toISOString(),
    signal: entry.signal,
  };
}
