import { z } from "zod";
import { Latitude, Longitude } from "../telemetry/common.ts";
import { Airport } from "./airports.ts";
import { AircraftClass } from "./aircraft-class.ts";
import { FlightId, IcaoCode, UtcTimestamp } from "./common.ts";
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

/** SSE event "snapshot", sent on connection: every flight on the map. */
export const LiveSnapshot = z.object({ flights: z.array(LiveFlight) });
export type LiveSnapshot = z.infer<typeof LiveSnapshot>;

/** SSE event "update", every 2 s when something changed. */
export const LiveUpdate = z.object({
  flights: z.array(LiveFlight),
  /** Flights to take off the map: closed, or silent for 10 minutes. */
  removed: z.array(FlightId),
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
