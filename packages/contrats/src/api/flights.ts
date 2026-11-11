import { z } from "zod";
import { CloseReason, FlightPhase } from "../flight/phase.ts";
import { AircraftInfo } from "../telemetry/aircraft.ts";
import { Heading, Latitude, Longitude } from "../telemetry/common.ts";
import { FlightId, IcaoCode, Sequence, UtcTimestamp } from "./common.ts";

/** POST /v1/flights */
export const OpenFlightRequest = z.object({
  flightId: FlightId,
  callsign: z.string().min(1).max(10),
  aircraft: AircraftInfo,
  departureIcao: IcaoCode.nullable(),
  plannedArrivalIcao: IcaoCode.nullable(),
  openedAt: UtcTimestamp,
  trackerVersion: z.string().min(1),
});
export type OpenFlightRequest = z.infer<typeof OpenFlightRequest>;

/** POST /v1/flights/{flightId}/positions: about 150 bytes, every 5 to 15 s. */
export const PositionReport = z.object({
  seq: Sequence,
  at: UtcTimestamp,
  lat: Latitude,
  lon: Longitude,
  altMsl: z.number(),
  gs: z.number().nonnegative(),
  heading: Heading,
  vs: z.number(),
  phase: FlightPhase,
  onGround: z.boolean(),
});
export type PositionReport = z.infer<typeof PositionReport>;

export const FlightEventType = z.enum([
  "phaseChanged",
  "rejectedTakeoff",
  "touchdown",
  "bounce",
  "goAround",
  "touchAndGo",
  "paused",
  "unpaused",
  "simRateChanged",
  "slew",
  "positionChanged",
  "aircraftChanged",
  "crashed",
  "resumed",
  "connectionLost",
  "connectionRestored",
]);
export type FlightEventType = z.infer<typeof FlightEventType>;

export const FlightEvent = z.object({
  seq: Sequence,
  at: UtcTimestamp,
  type: FlightEventType,
  /** Free context, e.g. { from: "CLIMB", to: "CRUISE" } for a phase change. */
  context: z.record(z.string(), z.unknown()),
});
export type FlightEvent = z.infer<typeof FlightEvent>;

/** POST /v1/flights/{flightId}/events: one or more events at once. */
export const FlightEventsRequest = z.object({
  events: z.array(FlightEvent).min(1).max(500),
});
export type FlightEventsRequest = z.infer<typeof FlightEventsRequest>;

/** POST /v1/flights/{flightId}/close */
export const CloseFlightRequest = z.object({
  closedAt: UtcTimestamp,
  reason: CloseReason,
});
export type CloseFlightRequest = z.infer<typeof CloseFlightRequest>;

/** GET /v1/flights/{flightId} */
export const FlightView = OpenFlightRequest.omit({ trackerVersion: true }).extend({
  closedAt: UtcTimestamp.nullable(),
  closeReason: CloseReason.nullable(),
  lastPhase: FlightPhase.nullable(),
  events: z.array(FlightEvent),
});
export type FlightView = z.infer<typeof FlightView>;
