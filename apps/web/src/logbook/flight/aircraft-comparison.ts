import type { LogbookEntry } from "@weems/contrats";

/** One figure of this flight against the mean of the pilot's flights on the same aircraft. */
export interface ComparedFigure {
  value: number;
  mean: number;
  /** Largest of the flights compared: the bars' scale. */
  max: number;
}

/** « Comparé à vos vols » (Pilot Pro, key sameAircraftComparison). */
export interface AircraftComparison {
  aircraft: string;
  /** Flights of the pilot on this aircraft, this one included. */
  flights: number;
  /** Rank of this touchdown among them, 1 = the softest; null when not measured. */
  touchdownRank: number | null;
  /** Touchdown and block time as positive numbers (ft/min, seconds); null when not measured. */
  touchdown: ComparedFigure | null;
  block: ComparedFigure | null;
}

const aircraftOf = (entry: LogbookEntry) =>
  entry.flight.aircraftModel ?? entry.flight.aircraftTitle;

function figure(values: readonly number[], value: number | null): ComparedFigure | null {
  if (value === null || values.length === 0) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { value, mean, max: Math.max(...values, value) };
}

/** Null when the pilot flew this aircraft only once: nothing to compare with. */
export function aircraftComparison(
  entry: LogbookEntry,
  entries: readonly LogbookEntry[],
): AircraftComparison | null {
  const aircraft = aircraftOf(entry);
  const same = entries.filter((e) => aircraftOf(e) === aircraft);
  if (same.length < 2) return null;
  const touchdowns = same.flatMap((e) => (e.touchdownVs === null ? [] : [-e.touchdownVs]));
  const blocks = same.flatMap((e) =>
    e.flight.times.blockS === null ? [] : [e.flight.times.blockS],
  );
  const mine = entry.touchdownVs === null ? null : -entry.touchdownVs;
  return {
    aircraft,
    flights: same.length,
    touchdownRank: mine === null ? null : 1 + touchdowns.filter((v) => v < mine).length,
    touchdown: figure(touchdowns, mine),
    block: figure(blocks, entry.flight.times.blockS),
  };
}
