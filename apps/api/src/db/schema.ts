import {
  bigint,
  customType,
  integer,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const utc = (name: string) => timestamp(name, { withTimezone: true, precision: 3, mode: "date" });

/** One row per flight, created when the tracker opens it. Never deleted (EF-14). */
export const flights = pgTable(
  "flights",
  {
    id: uuid("id").primaryKey(),
    pilotId: uuid("pilot_id").notNull(),
    callsign: text("callsign").notNull(),
    simulator: text("simulator").notNull(),
    aircraftTitle: text("aircraft_title").notNull(),
    aircraftModel: text("aircraft_model"),
    aircraftRegistration: text("aircraft_registration"),
    aircraftEngineCount: smallint("aircraft_engine_count").notNull(),
    aircraftEmptyWeightKg: doublePrecision("aircraft_empty_weight_kg"),
    departureIcao: text("departure_icao"),
    plannedArrivalIcao: text("planned_arrival_icao"),
    openedAt: utc("opened_at").notNull(),
    closedAt: utc("closed_at"),
    closeReason: text("close_reason"),
    trackerVersion: text("tracker_version").notNull(),
  },
  (table) => [index("flights_pilot_opened_idx").on(table.pilotId, table.openedAt)],
);

/** Flight events. The primary key (flight, seq) is what makes re-sends harmless. */
export const flightEvents = pgTable(
  "flight_events",
  {
    flightId: uuid("flight_id")
      .notNull()
      .references(() => flights.id),
    seq: bigint("seq", { mode: "number" }).notNull(),
    at: utc("at").notNull(),
    type: text("type").notNull(),
    context: jsonb("context").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.flightId, table.seq] })],
);

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

/** Trajectory of a flight, received once after closing (spec J2). */
export const flightTracks = pgTable("flight_tracks", {
  flightId: uuid("flight_id")
    .primaryKey()
    .references(() => flights.id),
  recordedPoints: integer("recorded_points").notNull(),
  /** SHA-256 of the received points: an identical re-send is recognised without decompressing. */
  sha256: text("sha256").notNull(),
  /** Every received point, JSON compressed with gzip. */
  points: bytea("points").notNull(),
  /** About 500 points for the pages, computed once on receipt. */
  simplified: jsonb("simplified").$type<unknown[]>().notNull(),
  receivedAt: utc("received_at").notNull(),
});
