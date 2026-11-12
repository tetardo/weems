import type {
  FlightEvent,
  FlightPhase,
  LiveFlight,
  LiveSnapshot,
  LiveUpdate,
  PositionReport,
} from "@weems/contrats";
import type { LiveFeed, LiveFlightInfo } from "../flights/live-feed.ts";
import { LiveEvents, liveEventOf } from "./live-events.ts";
import { LivePilots } from "./live-pilots.ts";
import { LiveTrails } from "./live-trails.ts";

/** Spec J1, part 3: "signal perdu" after 60 s, off the map after 10 min without news. */
const LOST_AFTER_MS = 60_000;
const REMOVED_AFTER_MS = 10 * 60_000;
/**
 * A flight is announced as started only when it appears before take-off: flights seen again in
 * the air after a restart of the API, or opened in the air, are not new starts.
 */
const STARTING_PHASES: ReadonlySet<FlightPhase> = new Set(["BOARDING", "PUSHBACK", "TAXI_OUT"]);

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
  /** Anonymous pilots until the profiles are plugged in (showPilots). */
  private pilots = new LivePilots(() => Promise.resolve(new Map()));
  /** Where each flight has been, for the route of the selected flight. */
  readonly trails = new LiveTrails();
  private readonly news = new LiveEvents();

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  /**
   * Shows the pilots whose profile is public. Plugged in after construction: the profiles need
   * the flights, which need this board.
   */
  showPilots(pilots: LivePilots): void {
    this.pilots = pilots;
  }

  /** Flights currently on the map. */
  get flightCount(): number {
    return this.entries.size;
  }

  /** Identifiers of the flights currently on the map. */
  flightIds(): string[] {
    return [...this.entries.keys()];
  }

  lastPosition(flightId: string): PositionReport | undefined {
    return this.entries.get(flightId)?.position;
  }

  /** The flight as shown on the map, or undefined when it is not on it. */
  flight(flightId: string): LiveFlight | undefined {
    const entry = this.entries.get(flightId);
    return entry && this.toLiveFlight(entry);
  }

  position(info: LiveFlightInfo, report: PositionReport): void {
    if (!this.entries.has(info.flightId) && STARTING_PHASES.has(report.phase)) {
      this.news.add(info, { at: report.at, kind: "started", touchdownVs: null });
    }
    this.entries.set(info.flightId, {
      info,
      position: report,
      receivedAtMs: this.now(),
      signal: "ok",
    });
    this.trails.add(info.flightId, report);
    this.changed.add(info.flightId);
    this.removed.delete(info.flightId);
  }

  closed(flightId: string): void {
    if (this.entries.delete(flightId)) this.markRemoved(flightId);
  }

  /** Take-offs and landings of a flight on the map; a flight not on it shows nothing. */
  events(flightId: string, events: readonly FlightEvent[]): void {
    const entry = this.entries.get(flightId);
    if (!entry) return;
    for (const event of events) {
      const shown = liveEventOf(event);
      if (shown) this.news.add(entry.info, shown);
    }
  }

  snapshot(): LiveSnapshot {
    return {
      flights: [...this.entries.values()].map((entry) => this.toLiveFlight(entry)),
      events: this.news.latest(),
    };
  }

  /**
   * Changes and events since the last call, after applying the silence rules. null when nothing
   * happened.
   */
  takeUpdate(): LiveUpdate | null {
    this.sweep();
    const events = this.news.take((pilotId) => this.pilots.of(pilotId));
    if (this.changed.size === 0 && this.removed.size === 0 && events.length === 0) return null;
    const flights = [...this.changed].flatMap((id) => {
      const entry = this.entries.get(id);
      return entry ? [this.toLiveFlight(entry)] : [];
    });
    const update = { flights, removed: [...this.removed], events };
    this.changed = new Set();
    this.removed = new Set();
    return update;
  }

  /**
   * Reads the pilots of the flights on the map (new ones at once, all of them every 30 s) and
   * sends again the flights whose pilot changed: a profile turned on or off.
   */
  async refreshPilots(): Promise<void> {
    const pilotOf = (entry: Entry) => entry.info.pilotId;
    const changed = await this.pilots.refresh([...this.entries.values()].map(pilotOf));
    for (const [id, entry] of this.entries) if (changed.has(pilotOf(entry))) this.changed.add(id);
  }

  private toLiveFlight({ info, position, receivedAtMs, signal }: Entry): LiveFlight {
    const { pilotId, ...shown } = info;
    return {
      ...shown,
      pilot: this.pilots.of(pilotId),
      position,
      receivedAt: new Date(receivedAtMs).toISOString(),
      signal,
    };
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
    this.trails.forget(flightId);
    this.changed.delete(flightId);
    this.removed.add(flightId);
  }
}
