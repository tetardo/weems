import type { FlightPhase, LiveFlight, PositionReport } from "@weems/contrats";
import type { LiveFlights } from "../live/flights-store.ts";

/** The 12 phases of the tracker, grouped for the home board (spec J4 accueil, part 5). */
export type PhaseGroup = "ground" | "climb" | "cruise" | "descent" | "approach";

const GROUPS: Record<FlightPhase, PhaseGroup> = {
  BOARDING: "ground",
  PUSHBACK: "ground",
  TAXI_OUT: "ground",
  TAKEOFF: "climb",
  CLIMB: "climb",
  CRUISE: "cruise",
  DESCENT: "descent",
  APPROACH: "approach",
  FINAL: "approach",
  LANDING: "approach",
  TAXI_IN: "ground",
  ARRIVED: "ground",
};

export const phaseGroup = (phase: FlightPhase): PhaseGroup => GROUPS[phase];

/** Where the aircraft is vertically: on the ground, a flight level, or feet below 10 000 ft. */
export type Level =
  { kind: "ground" } | { kind: "flightLevel"; value: string } | { kind: "feet"; value: number };

const TRANSITION_FT = 10_000;

export function levelOf(position: Pick<PositionReport, "altMsl" | "onGround">): Level {
  if (position.onGround) return { kind: "ground" };
  if (position.altMsl >= TRANSITION_FT) {
    return {
      kind: "flightLevel",
      value: `FL${String(Math.round(position.altMsl / 100)).padStart(3, "0")}`,
    };
  }
  return { kind: "feet", value: Math.max(0, Math.round(position.altMsl / 100) * 100) };
}

export interface BoardRow {
  flightId: string;
  callsign: string;
  from: string | null;
  to: string | null;
  phase: PhaseGroup;
  level: Level;
}

const toRow = (flight: LiveFlight): BoardRow => ({
  flightId: flight.flightId,
  callsign: flight.callsign,
  from: flight.departureIcao,
  to: flight.plannedArrivalIcao,
  phase: phaseGroup(flight.position.phase),
  level: levelOf(flight.position),
});

/** Rows of the board on a computer; a phone shows the first `BOARD_ROWS_PHONE` only. */
const BOARD_ROWS = 8;
export const BOARD_ROWS_PHONE = 4;

/** At most `max` flights, those heard from most recently; flights whose signal is lost are left out. */
export function boardRows(flights: LiveFlights, max = BOARD_ROWS): BoardRow[] {
  return [...flights.values()]
    .filter((flight) => flight.signal === "ok")
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, max)
    .map(toRow);
}

/** Flights live but not on the board (« + N vols »): the map shows them all, lost signals included. */
export const moreFlights = (live: number, shown: number): number => Math.max(0, live - shown);

/** Digits of a counter, padded with dimmed zeros to `width` (split-flap look). */
export function flapDigits(value: number, width: number): { digit: string; padding: boolean }[] {
  const digits = String(Math.max(0, Math.trunc(value)));
  const padding = Math.max(0, width - digits.length);
  return [
    ...Array.from({ length: padding }, () => ({ digit: "0", padding: true })),
    ...[...digits].map((digit) => ({ digit, padding: false })),
  ];
}
