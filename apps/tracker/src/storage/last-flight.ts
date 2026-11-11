import { touchdownVsOf } from "@weems/contrats";
import type { LastFlight } from "../core/last-flight.ts";
import type { Database } from "./sqlite.ts";

interface Row {
  flight_id: string;
  aircraft_title: string;
  opened_at: string;
  closed_at: string;
  close_reason: string | null;
}

/** Reads the most recently closed flight and its landing from the local database. */
export function lastClosedFlight(db: Database): LastFlight | null {
  const row = db
    .prepare(
      "SELECT flight_id, aircraft_title, opened_at, closed_at, close_reason FROM sessions " +
        "WHERE state = 'closed' AND closed_at IS NOT NULL ORDER BY closed_at DESC LIMIT 1",
    )
    .get() as Row | undefined;
  if (!row) return null;
  const events = db
    .prepare("SELECT data FROM events WHERE flight_id = ? ORDER BY seq")
    .all(row.flight_id) as unknown as { data: string }[];
  const parsed = events.map(
    (e) => JSON.parse(e.data) as { type: string; context: Record<string, unknown> },
  );
  const count = (type: string) => parsed.filter((e) => e.type === type).length;
  const touchdown = parsed.findLast((e) => e.type === "touchdown");
  return {
    flightId: row.flight_id,
    aircraftTitle: row.aircraft_title,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    closeReason: row.close_reason,
    touchdownFpm: touchdown ? touchdownVsOf(touchdown) : null,
    goArounds: count("goAround"),
    bounces: count("bounce"),
  };
}
