import Database from "better-sqlite3";
import type {
  CloseFlightRequest,
  FlightEvent,
  FlightPhase,
  OpenFlightRequest,
  PositionReport,
  Sample,
} from "@weems/contrats";
import type { SavedFlight } from "../core/recovery.ts";
import { migrate } from "./schema.ts";

interface SessionRow {
  flight_id: string;
  aircraft_title: string;
  last_seq: number;
  last_position_seq: number;
  last_phase: FlightPhase | null;
  last_lat: number | null;
  last_lon: number | null;
  last_at: string | null;
}

/**
 * Local recorder (architecture interne, part 3). Each message to the API is written to
 * the outbox in the same transaction as the data it carries: nothing is recorded without
 * being scheduled for sending. Samples are buffered and written once per second (flush).
 */
export class Recorder {
  readonly db: Database.Database;
  private buffer: { flightId: string; sample: Sample }[] = [];

  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    migrate(this.db);
  }

  close(): void {
    this.flush();
    this.db.close();
  }

  open(request: OpenFlightRequest): void {
    this.db.transaction(() => {
      this.db
        .prepare(
          "INSERT INTO sessions (flight_id, state, aircraft_title, opened_at) VALUES (?, 'flying', ?, ?)",
        )
        .run(request.flightId, request.aircraft.title, request.openedAt);
      this.enqueue(request.flightId, "open", request);
    })();
  }

  event(flightId: string, event: FlightEvent): void {
    const phase = event.type === "phaseChanged" ? (event.context["to"] as FlightPhase) : null;
    this.db.transaction(() => {
      this.db
        .prepare("INSERT INTO events (flight_id, seq, data) VALUES (?, ?, ?)")
        .run(flightId, event.seq, JSON.stringify(event));
      this.db
        .prepare(
          `UPDATE sessions SET last_seq = ?, last_at = ?, last_phase = COALESCE(?, last_phase)
           WHERE flight_id = ?`,
        )
        .run(event.seq, event.at, phase, flightId);
      this.enqueue(flightId, "events", { events: [event] });
    })();
  }

  /** Positions are not queued (only the newest counts): the session row keeps the last one. */
  position(flightId: string, report: PositionReport): void {
    this.db
      .prepare(
        `UPDATE sessions SET last_position_seq = ?, last_lat = ?, last_lon = ?, last_at = ?
         WHERE flight_id = ?`,
      )
      .run(report.seq, report.lat, report.lon, report.at, flightId);
  }

  closeFlight(flightId: string, request: CloseFlightRequest): void {
    this.flush();
    this.db.transaction(() => {
      this.db
        .prepare(
          "UPDATE sessions SET state = 'closed', closed_at = ?, close_reason = ? WHERE flight_id = ?",
        )
        .run(request.closedAt, request.reason, flightId);
      this.enqueue(flightId, "close", request);
    })();
  }

  sample(flightId: string, sample: Sample): void {
    this.buffer.push({ flightId, sample });
  }

  /** Writes buffered samples in one transaction; called every second by the runtime. */
  flush(): void {
    if (this.buffer.length === 0) return;
    const insert = this.db.prepare("INSERT INTO samples (flight_id, t, data) VALUES (?, ?, ?)");
    const pending = this.buffer;
    this.buffer = [];
    this.db.transaction(() => {
      for (const { flightId, sample } of pending)
        insert.run(flightId, sample.t, JSON.stringify(sample));
    })();
  }

  /** Flights still "flying" at start-up: the tracker or the PC stopped during a flight. */
  unfinishedFlights(): SavedFlight[] {
    const rows = this.db
      .prepare("SELECT * FROM sessions WHERE state = 'flying' ORDER BY opened_at")
      .all() as SessionRow[];
    return rows.map((row) => ({
      flightId: row.flight_id,
      aircraftTitle: row.aircraft_title,
      lastSeq: row.last_seq,
      lastPositionSeq: row.last_position_seq,
      lastPhase: row.last_phase,
      lastLat: row.last_lat,
      lastLon: row.last_lon,
      lastAt: row.last_at,
    }));
  }

  private enqueue(flightId: string, kind: "open" | "events" | "close", payload: unknown): void {
    this.db
      .prepare("INSERT INTO outbox (flight_id, kind, payload) VALUES (?, ?, ?)")
      .run(flightId, kind, JSON.stringify(payload));
  }
}
