import { z } from "zod";
import { CloseReason } from "../flight/phase.ts";
import { AircraftCategory, AircraftClass } from "./aircraft-class.ts";
import { FlightId, IcaoCode, UtcTimestamp } from "./common.ts";

/** Times of a flight, in seconds; null when not measurable (spec site minimal, header). */
export const FlightTimes = z.object({
  /** Opening (first engine start or pushback) to closing. */
  blockS: z.number().nonnegative().nullable(),
  /** Liftoff to last touchdown, pauses excluded (EF-15). */
  airborneS: z.number().nonnegative().nullable(),
  /** Time spent paused, shown apart (EF-15). */
  pausedS: z.number().nonnegative(),
});
export type FlightTimes = z.infer<typeof FlightTimes>;

/** Notable events shown as badges in the list. */
export const FlightAlert = z.enum([
  "paused",
  "simRateChanged",
  "slew",
  "positionChanged",
  "crashed",
]);
export type FlightAlert = z.infer<typeof FlightAlert>;

/** One line of the flight list (GET /v1/flights). */
export const FlightSummary = z.object({
  flightId: FlightId,
  callsign: z.string(),
  aircraftTitle: z.string(),
  aircraftModel: z.string().nullable(),
  /** null when nothing is known about the aircraft (flights recorded before the categories). */
  aircraftClass: AircraftClass.nullable(),
  departureIcao: IcaoCode.nullable(),
  plannedArrivalIcao: IcaoCode.nullable(),
  openedAt: UtcTimestamp,
  closedAt: UtcTimestamp.nullable(),
  closeReason: CloseReason.nullable(),
  times: FlightTimes,
  alerts: z.array(FlightAlert),
});
export type FlightSummary = z.infer<typeof FlightSummary>;

/** GET /v1/flights query: newest first, cursor pagination (API conventions). */
export const FlightListQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  /** Flights opened at or after this time. */
  from: UtcTimestamp.optional(),
  /** Flights opened before this time. */
  to: UtcTimestamp.optional(),
  /** Part of the aircraft title or ICAO type, any case. */
  aircraft: z.string().min(1).max(64).optional(),
  /** Category of the aircraft, from the catalogue or estimated. */
  category: AircraftCategory.optional(),
  /** Departure or planned arrival. */
  airport: IcaoCode.optional(),
});
export type FlightListQuery = z.infer<typeof FlightListQuery>;

export const FlightList = z.object({
  flights: z.array(FlightSummary),
  /** Pass as `cursor` to get the next page; null on the last page. */
  nextCursor: z.string().nullable(),
});
export type FlightList = z.infer<typeof FlightList>;
