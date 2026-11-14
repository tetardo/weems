import type { GoalAircraft, GoodPractice, TrackPoint } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { markReasons } from "../logbook/marks.ts";
import { logbookEntry } from "../logbook/entries.ts";

/** What the goals need of one closed flight. */
export interface FlightFact {
  flightId: string;
  at: number;
  departureIcao: string | null;
  arrivalIcao: string | null;
  hours: number;
  /** ft/min (negative); null when not measured or without landing. */
  touchdownVs: number | null;
  clean: boolean;
  category: string | null;
  model: string | null;
  /** Followed or not; null when it cannot be checked (no trajectory, no bank recorded). */
  practices: Record<GoodPractice, boolean | null>;
}

function practicesOf(
  { summary }: SummaryWithEvents,
  points: readonly TrackPoint[] | undefined,
): FlightFact["practices"] {
  const traced = points && points.length > 1;
  const reasons = traced ? markReasons(points) : new Set<string>();
  const bank = traced && points.some((p) => p.bank !== undefined);
  return {
    noAlert: summary.alerts.length === 0,
    speed250: traced ? !reasons.has("speed250") : null,
    sinkRate: traced ? !reasons.has("sinkRate") : null,
    bank30: bank ? !reasons.has("bank30") : null,
  };
}

/** Facts of the closed flights, oldest first; trajectories only for the good practices. */
export function flightFacts(
  closed: readonly SummaryWithEvents[],
  tracks: ReadonlyMap<string, readonly TrackPoint[]>,
): FlightFact[] {
  return closed
    .map((flight) => {
      const { summary } = flight;
      const entry = logbookEntry(flight);
      const seconds = summary.times.airborneS ?? summary.times.blockS ?? 0;
      return {
        flightId: summary.flightId,
        at: Date.parse(summary.openedAt),
        departureIcao: summary.departureIcao,
        arrivalIcao: summary.plannedArrivalIcao,
        hours: seconds / 3600,
        touchdownVs: entry.touchdownVs,
        clean: entry.verdict === "clean",
        category: summary.aircraftClass?.category ?? null,
        model: summary.aircraftModel,
        practices: practicesOf(flight, tracks.get(summary.flightId)),
      };
    })
    .sort((a, b) => a.at - b.at);
}

/** The flight was made on the goal's aircraft (every aircraft when the goal names none). */
export function onAircraft(fact: FlightFact, aircraft: GoalAircraft | null): boolean {
  if (aircraft === null) return true;
  return "category" in aircraft
    ? fact.category === aircraft.category
    : fact.model === aircraft.model;
}
