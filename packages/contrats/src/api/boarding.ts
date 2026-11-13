import { z } from "zod";
import { AircraftClass } from "./aircraft-class.ts";
import { FlightId, IcaoCode, UtcTimestamp } from "./common.ts";
import { LivePilot } from "./live.ts";

/**
 * Status of a flight on the Boarding page (spec web Boarding): the 12 phases of the tracker
 * grouped as on an airport board, plus « signal perdu ». No « scheduled » or « delayed »: pilots
 * do not declare a planned time.
 */
export const BoardingStatus = z.enum([
  "boarding",
  "pushback",
  "taxi",
  "departed",
  "airborne",
  "approach",
  "landed",
  "lost",
]);
export type BoardingStatus = z.infer<typeof BoardingStatus>;

/** One line of the Departures or Arrivals board. */
export const BoardingFlight = z.object({
  flightId: FlightId,
  callsign: z.string(),
  /** Type as given by the simulator (often the ICAO code, « A320 »), or the aircraft title. */
  aircraftType: z.string(),
  aircraftClass: AircraftClass.nullable(),
  departureIcao: IcaoCode.nullable(),
  /** Airport name from the API's list; null when the code is absent or unknown. */
  departureName: z.string().nullable(),
  arrivalIcao: IcaoCode.nullable(),
  arrivalName: z.string().nullable(),
  /** Pilot only while their profile is public; null shows « Pilote masqué ». */
  pilot: LivePilot.nullable(),
  status: BoardingStatus,
  /** When the API first saw the flight (start, before take-off). */
  startedAt: UtcTimestamp,
  /** null before take-off, or when the API restarted after it. */
  takeoffAt: UtcTimestamp.nullable(),
  /** In the air: from the remaining distance and the ground speed; null when unknown. */
  estimatedArrivalAt: UtcTimestamp.nullable(),
  /** Touchdown time and vertical speed (ft/min, negative), once landed. */
  landedAt: UtcTimestamp.nullable(),
  touchdownVs: z.number().nullable(),
  /**
   * The flight is closed (the tracker sent its end): with a public pilot, its public page
   * /pilots/{handle}/flights/{id} exists. Still open, it is only on the live map.
   */
  closed: z.boolean(),
  /** Flown by a fictitious account of the simulated activity. */
  fictitious: z.boolean(),
});
export type BoardingFlight = z.infer<typeof BoardingFlight>;

/** Landed flights stay on the Arrivals board this long after touchdown. */
export const BOARDING_LANDED_KEEP_MS = 60 * 60_000;

/**
 * GET /v1/live/boarding: every flight live now, as two airport boards. Departures: newest first.
 * Arrivals: flights in the air by estimated time, then those landed within the last hour, newest
 * first.
 */
export const Boarding = z.object({
  generatedAt: UtcTimestamp,
  departures: z.array(BoardingFlight),
  arrivals: z.array(BoardingFlight),
});
export type Boarding = z.infer<typeof Boarding>;
