import { z } from "zod";
import { Latitude, Longitude } from "../telemetry/common.ts";
import { Airport } from "./airports.ts";
import { AircraftClass } from "./aircraft-class.ts";
import { FlightId, IcaoCode, UtcTimestamp } from "./common.ts";
import { PilotRank } from "./ranks.ts";
import { PositionReport } from "./flights.ts";
import { CountryCode, PilotHandle } from "./profiles.ts";

/**
 * Pilot of a live flight, only while their public profile is on (spec J4, carte en direct):
 * the map links to the profile. null otherwise, so a private pilot stays anonymous.
 */
export const LivePilot = z.object({
  handle: PilotHandle,
  name: z.string(),
  country: CountryCode.nullable(),
  /** Photo at GET /v1/pilots/{handle}/photo; initials otherwise. */
  hasPhoto: z.boolean(),
  /** Confirmed founder number (offer « Pilote fondateur »); absent otherwise. */
  founderNumber: z.number().int().positive().optional(),
  /** Rank earned by valid flights (spec grades des pilotes); absent while unknown. */
  rank: PilotRank.optional(),
});
export type LivePilot = z.infer<typeof LivePilot>;

/** One flight on the live map (spec J1, part 3). */
export const LiveFlight = z.object({
  flightId: FlightId,
  callsign: z.string(),
  aircraftTitle: z.string(),
  aircraftModel: z.string().nullable(),
  /** Colour and silhouette on the map (spec J4, aircraft categories). */
  aircraftClass: AircraftClass.nullable(),
  departureIcao: IcaoCode.nullable(),
  plannedArrivalIcao: IcaoCode.nullable(),
  position: PositionReport,
  /** When the API received the position (server clock). */
  receivedAt: UtcTimestamp,
  /** "lost": no position for 60 s; shown greyed. */
  signal: z.enum(["ok", "lost"]),
  pilot: LivePilot.nullable(),
  /** Flown by a fictitious account of the simulated activity: the map shows a badge. */
  fictitious: z.boolean(),
});
export type LiveFlight = z.infer<typeof LiveFlight>;

/**
 * Something that just happened on the live map (spec J4, carte en direct): a take-off, a landing
 * with its vertical speed at touchdown, or a public pilot starting a flight. A pilot whose
 * profile is not public is never named, and never announced when starting.
 */
export const LiveEvent = z.object({
  at: UtcTimestamp,
  flightId: FlightId,
  callsign: z.string(),
  kind: z.enum(["takeoff", "landing", "started"]),
  /** Departure for a take-off or a start, planned arrival for a landing; null when not given. */
  airportIcao: IcaoCode.nullable(),
  /** Started: the planned arrival, for « LFPG → EGCC ». */
  arrivalIcao: IcaoCode.nullable(),
  /** Landing: vertical speed at touchdown, ft/min (negative = descending); null otherwise. */
  touchdownVs: z.number().nullable(),
  pilot: LivePilot.nullable(),
});
export type LiveEvent = z.infer<typeof LiveEvent>;

/** At most this many events in a snapshot, newest first. */
export const MAX_LIVE_EVENTS = 10;

/** SSE event "snapshot", sent on connection: every flight on the map and the latest events. */
export const LiveSnapshot = z.object({
  flights: z.array(LiveFlight),
  events: z.array(LiveEvent).max(MAX_LIVE_EVENTS),
});
export type LiveSnapshot = z.infer<typeof LiveSnapshot>;

/** SSE event "update", every 2 s when something changed. */
export const LiveUpdate = z.object({
  flights: z.array(LiveFlight),
  /** Flights to take off the map: closed, or silent for 10 minutes. */
  removed: z.array(FlightId),
  /** Events since the previous update, oldest first. */
  events: z.array(LiveEvent),
});
export type LiveUpdate = z.infer<typeof LiveUpdate>;

/**
 * GET /v1/live/flights/{flightId}/route: what the live map draws for the selected flight.
 * An airport is null when the pilot did not give it in the tracker, or when its code is not in
 * the airport list.
 */
export const LiveRoute = z.object({
  departure: Airport.nullable(),
  arrival: Airport.nullable(),
  /** Positions flown since the API last started, oldest first, as [lon, lat] (GeoJSON order), thinned out. */
  trail: z.array(z.tuple([Longitude, Latitude])),
});
export type LiveRoute = z.infer<typeof LiveRoute>;

/**
 * One point of a flight in progress, as the live map last received it: what the page of a flight
 * in progress draws (altitude profile, flight bands) until the trajectory arrives at closing.
 */
export const LiveTrailPoint = PositionReport.pick({
  at: true,
  lat: true,
  lon: true,
  altMsl: true,
  gs: true,
  vs: true,
  phase: true,
});
export type LiveTrailPoint = z.infer<typeof LiveTrailPoint>;

/**
 * GET /v1/live/flights/{flightId}/trail: the points kept since the API last started, oldest first,
 * one every 15 s of flight time (spec vol en cours).
 */
export const LiveTrail = z.object({ points: z.array(LiveTrailPoint) });
export type LiveTrail = z.infer<typeof LiveTrail>;
