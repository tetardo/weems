import {
  FLIGHT_PHASES,
  phaseChangeOf,
  type FlightPhase,
  type GoodPractice,
  type LogbookStats,
} from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { markReasons } from "./marks.ts";
import type { Tracks } from "./stats-input.ts";
import { groupBy } from "./tally.ts";

type Flights = readonly SummaryWithEvents[];
type PhaseSeconds = Map<FlightPhase, number>;

/** Seconds spent in each phase: from one change of phase to the next (the last one is open). */
function phaseSeconds({ events }: SummaryWithEvents): PhaseSeconds {
  const changes = events.flatMap((event) => {
    const change = phaseChangeOf(event);
    return change ? [{ phase: change.to, at: Date.parse(event.at) }] : [];
  });
  const seconds: PhaseSeconds = new Map();
  changes.forEach((change, i) => {
    const next = changes[i + 1];
    if (!next) return;
    seconds.set(change.phase, (seconds.get(change.phase) ?? 0) + (next.at - change.at) / 1000);
  });
  return seconds;
}

/** « Temps moyen par phase » (Pilot Pro): flights of the most flown category, phase by phase. */
export function phaseTimeOf(flights: Flights): NonNullable<LogbookStats["phaseTime"]> {
  const groups = [...groupBy(flights, ({ summary }) => summary.aircraftClass?.category ?? null)];
  const [category, group] = groups.sort(([, a], [, b]) => b.length - a.length)[0] ?? [null, []];
  const timed = group.map(phaseSeconds).filter((seconds) => seconds.size > 0);
  const phases = FLIGHT_PHASES.flatMap((phase) => {
    const total = timed.reduce((sum, seconds) => sum + (seconds.get(phase) ?? 0), 0);
    return total > 0 ? [{ phase, seconds: total / timed.length }] : [];
  });
  return { category, flights: timed.length, phases };
}

/** Share of flights that followed a practice, among the flights where it could be checked. */
function practiceRow(practice: GoodPractice, followed: readonly boolean[]) {
  const kept = followed.filter(Boolean).length;
  return {
    practice,
    flights: followed.length,
    share: followed.length === 0 ? null : kept / followed.length,
  };
}

/**
 * « Bonnes pratiques » (Pilot Pro): flights without alert, then the provisional criteria of the
 * band marks over the trajectories (the bank only where the tracker recorded it).
 */
export function goodPracticesOf(
  flights: Flights,
  tracks: Tracks,
): NonNullable<LogbookStats["goodPractices"]> {
  const traced = flights.flatMap(({ summary }) => {
    const points = tracks.get(summary.flightId);
    return points && points.length > 1 ? [points] : [];
  });
  const reasons = traced.map(markReasons);
  const withBank = traced.flatMap((points, i) =>
    points.some((p) => p.bank !== undefined) ? [reasons[i] ?? new Set()] : [],
  );
  return [
    practiceRow(
      "noAlert",
      flights.map(({ summary }) => summary.alerts.length === 0),
    ),
    practiceRow(
      "speed250",
      reasons.map((r) => !r.has("speed250")),
    ),
    practiceRow(
      "sinkRate",
      reasons.map((r) => !r.has("sinkRate")),
    ),
    practiceRow(
      "bank30",
      withBank.map((r) => !r.has("bank30")),
    ),
  ];
}
