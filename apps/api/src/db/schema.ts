import {
  bigint,
  boolean,
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
import { users } from "./auth-schema.ts";
import { bytea } from "./bytea.ts";

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
    aircraftEngineType: text("aircraft_engine_type"),
    aircraftAirframe: text("aircraft_airframe"),
    aircraftMaxGrossWeightKg: doublePrecision("aircraft_max_gross_weight_kg"),
    /** Category from the catalogue or estimated (modules/aircraft), stored for the filters. */
    aircraftCategory: text("aircraft_category"),
    aircraftCategoryEstimated: boolean("aircraft_category_estimated").notNull().default(false),
    departureIcao: text("departure_icao"),
    plannedArrivalIcao: text("planned_arrival_icao"),
    openedAt: utc("opened_at").notNull(),
    closedAt: utc("closed_at"),
    closeReason: text("close_reason"),
    trackerVersion: text("tracker_version").notNull(),
  },
  (table) => [
    index("flights_pilot_opened_idx").on(table.pilotId, table.openedAt),
    index("flights_pilot_category_idx").on(table.pilotId, table.aircraftCategory),
  ],
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
/** The pilot's check of the phases of a flight (J3 alpha): one per flight, the latest wins. */
export const flightReviews = pgTable("flight_reviews", {
  flightId: uuid("flight_id")
    .primaryKey()
    .references(() => flights.id),
  /** "correct" or "wrong". */
  phases: text("phases").notNull(),
  note: text("note").notNull(),
  reviewedAt: utc("reviewed_at").notNull(),
});

/** Public profile of a pilot (spec J4 profil public). Off by default; one row once the pilot saves it. */
export const pilotProfiles = pgTable(
  "pilot_profiles",
  {
    pilotId: uuid("pilot_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Address of the profile, /pilots/{handle}; unique, kept while the profile is off. */
    handle: text("handle").unique(),
    isPublic: boolean("is_public").notNull().default(false),
    country: text("country"),
    homeIcao: text("home_icao"),
    level: text("level"),
    vatsimId: text("vatsim_id"),
    ivaoId: text("ivao_id"),
    instagram: text("instagram"),
    facebook: text("facebook"),
    simbriefId: text("simbrief_id"),
    /** Last time the profile was made public: proof of consent. */
    publishedAt: utc("published_at"),
    unpublishedAt: utc("unpublished_at"),
    updatedAt: utc("updated_at").notNull(),
  },
  (table) => [index("pilot_profiles_public_idx").on(table.isPublic)],
);

/** Flights the pilot keeps off the public profile. */
export const hiddenFlights = pgTable(
  "profile_hidden_flights",
  {
    flightId: uuid("flight_id")
      .primaryKey()
      .references(() => flights.id, { onDelete: "cascade" }),
    /** Copy of the flight's pilot: the profile module reads its own table only. */
    pilotId: uuid("pilot_id").notNull(),
    hiddenAt: utc("hidden_at").notNull(),
  },
  (table) => [index("profile_hidden_flights_pilot_idx").on(table.pilotId)],
);

/** Profile photo, already square, 256 px, WebP, without metadata. */
export const pilotPhotos = pgTable("pilot_photos", {
  pilotId: uuid("pilot_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  webp: bytea("webp").notNull(),
  updatedAt: utc("updated_at").notNull(),
});

/** Home page background of each theme (spec J4 personnalisation): WebP, 2 560 px wide at most. */
export const siteHomeImages = pgTable("site_home_images", {
  /** "light" or "dark". */
  theme: text("theme").primaryKey(),
  webp: bytea("webp").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  /** "left", "center" or "right": what the crop keeps. */
  focus: text("focus").notNull(),
  credit: text("credit").notNull(),
  licence: text("licence").notNull(),
  updatedAt: utc("updated_at").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
});

/**
 * Plan chosen with the Free/Pro test switch of the site bar, outside production only (removed
 * before the 1.0, when subscriptions answer GET /v1/me/plan). No row: Pilot Free.
 */
export const testPlans = pgTable("test_plans", {
  pilotId: uuid("pilot_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(),
  updatedAt: utc("updated_at").notNull(),
});

/**
 * Objectifs of the private logbook (spec carnet privé, § 6): what the pilot aims at, as written
 * by GoalDefinition (packages/contrats); progress is computed from the flights, never stored.
 */
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey(),
    pilotId: uuid("pilot_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    definition: jsonb("definition").notNull(),
    createdAt: utc("created_at").notNull(),
    updatedAt: utc("updated_at").notNull(),
    /** Set aside by the pilot (or replaced, for a free pilot); null while it runs. */
    archivedAt: utc("archived_at"),
  },
  (table) => [index("goals_pilot_idx").on(table.pilotId)],
);

export * from "./auth-schema.ts";
