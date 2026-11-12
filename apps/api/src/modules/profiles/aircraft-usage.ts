import type { SummaryWithEvents } from "../flights/service.ts";

/** What tells two aircraft apart: the ICAO type, else the title of the simulator. */
export const aircraftKey = ({ summary }: SummaryWithEvents): string =>
  summary.aircraftModel ?? summary.aircraftTitle;

/** The most flown aircraft (ICAO types, else titles), most flown first, at most `count`. */
export function mostFlownTypes(flights: readonly SummaryWithEvents[], count: number): string[] {
  const counts = new Map<string, number>();
  for (const flight of flights) {
    counts.set(aircraftKey(flight), (counts.get(aircraftKey(flight)) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([key]) => key);
}
