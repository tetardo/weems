import {
  type Airport,
  type Boarding,
  type BoardingFlight,
  type BoardingStatus,
  distanceNm,
  type FlightPhase,
  type LiveFlight,
} from "@weems/contrats";
import type { BoardingTimes } from "./boarding-log.ts";

/** A flight as the board sees it: what the map shows, and when each step happened. */
export interface BoardingSource {
  flight: LiveFlight;
  times: BoardingTimes;
}

/** « Décollé » for this long after take-off, then « En vol » (spec web Boarding). */
const DEPARTED_FOR_MS = 15 * 60_000;
/** Below this ground speed, no estimated time: it would be absurd. */
const MIN_SPEED_FOR_ESTIMATE_KT = 50;

const STATUS_OF_PHASE: Record<FlightPhase, BoardingStatus> = {
  BOARDING: "boarding",
  PUSHBACK: "pushback",
  TAXI_OUT: "taxi",
  TAKEOFF: "departed",
  CLIMB: "airborne",
  CRUISE: "airborne",
  DESCENT: "airborne",
  APPROACH: "approach",
  FINAL: "approach",
  LANDING: "landed",
  TAXI_IN: "landed",
  ARRIVED: "landed",
};

const BEFORE_TAKEOFF: ReadonlySet<BoardingStatus> = new Set(["boarding", "pushback", "taxi"]);

/**
 * Status on the board: the phase, « Décollé » just after take-off, « Perdu » without signal.
 * « Just after » is measured on the flight's own clock (its last position), which a simulation
 * running faster than real time also follows.
 */
export function boardingStatusOf({ flight, times }: BoardingSource): BoardingStatus {
  if (times.landedAt) return "landed";
  if (flight.signal === "lost") return "lost";
  const status = STATUS_OF_PHASE[flight.position.phase];
  const justAirborne =
    status === "airborne" &&
    times.takeoffAt !== null &&
    Date.parse(flight.position.at) - Date.parse(times.takeoffAt) < DEPARTED_FOR_MS;
  return justAirborne ? "departed" : status;
}

/**
 * In the air with a known arrival: time of the last position + remaining great-circle distance at
 * the ground speed (the flight's own clock, like « Décollé »).
 */
function estimatedArrival(flight: LiveFlight, arrival: Airport | null): string | null {
  const { lat, lon, gs, onGround, at } = flight.position;
  if (!arrival || onGround || gs < MIN_SPEED_FOR_ESTIMATE_KT) return null;
  const hours = distanceNm(lat, lon, arrival.lat, arrival.lon) / gs;
  return new Date(Date.parse(at) + hours * 3_600_000).toISOString();
}

function toBoardingFlight(
  source: BoardingSource,
  findAirport: (icao: string | null) => Airport | null,
  closed: boolean,
): BoardingFlight {
  const { flight, times } = source;
  const departure = findAirport(flight.departureIcao);
  const arrival = findAirport(flight.plannedArrivalIcao);
  const status = boardingStatusOf(source);
  return {
    flightId: flight.flightId,
    callsign: flight.callsign,
    aircraftType: flight.aircraftModel ?? flight.aircraftTitle,
    aircraftClass: flight.aircraftClass,
    departureIcao: flight.departureIcao,
    departureName: departure?.name ?? null,
    arrivalIcao: flight.plannedArrivalIcao,
    arrivalName: arrival?.name ?? null,
    pilot: flight.pilot,
    status,
    ...times,
    estimatedArrivalAt:
      status === "landed" || BEFORE_TAKEOFF.has(status) ? null : estimatedArrival(flight, arrival),
    closed,
    fictitious: flight.fictitious,
  };
}

const departureTime = (flight: BoardingFlight) => flight.takeoffAt ?? flight.startedAt;
/** Unknown estimates last. */
const estimateKey = (flight: BoardingFlight) => flight.estimatedArrivalAt ?? "~";

/**
 * The two boards (spec web Boarding). Departures: every flight not landed yet, newest departure
 * first. Arrivals: flights in the air by estimated time, then landed ones, newest first. `landed`
 * holds the flights closed after a touchdown.
 */
export function buildBoarding(
  live: readonly BoardingSource[],
  landed: readonly BoardingSource[],
  findAirport: (icao: string | null) => Airport | null,
  nowMs: number,
): Boarding {
  const flights = [
    ...live.map((source) => toBoardingFlight(source, findAirport, false)),
    ...landed.map((source) => toBoardingFlight(source, findAirport, true)),
  ];
  const notLanded = flights.filter((flight) => flight.status !== "landed");
  const enRoute = notLanded.filter((flight) => !BEFORE_TAKEOFF.has(flight.status));
  const down = flights.filter((flight) => flight.status === "landed");
  return {
    generatedAt: new Date(nowMs).toISOString(),
    departures: notLanded.sort((a, b) => departureTime(b).localeCompare(departureTime(a))),
    arrivals: [
      ...enRoute.sort((a, b) => estimateKey(a).localeCompare(estimateKey(b))),
      ...down.sort((a, b) => (b.landedAt ?? "").localeCompare(a.landedAt ?? "")),
    ],
  };
}
