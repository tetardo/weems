import { z } from "zod";
import { AircraftClass } from "./aircraft-class.ts";
import { FlightId, IcaoCode, UtcTimestamp } from "./common.ts";
import { PositionReport } from "./flights.ts";

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
