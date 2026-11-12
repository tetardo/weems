import type { PopulationResult } from "@weems/contrats";
import type { ActivityRun, LiveResult } from "./activity-view.ts";

const isPopulation = (result: PopulationResult | LiveResult): result is PopulationResult =>
  "filledProfiles" in result;

/** Success: the tool ended by itself, everything was sent, every planned flight arrived. */
export function outcomeOf(
  exitCode: number | null,
  stopping: boolean,
  result: PopulationResult | LiveResult | null,
): NonNullable<ActivityRun["outcome"]> {
  if (stopping || result?.stopped) return "stopped";
  if (exitCode !== 0 || !result) return "failed";
  if (isPopulation(result)) {
    const { flights, filledProfiles } = result;
    return flights.done === flights.total && filledProfiles.done === filledProfiles.total
      ? "success"
      : "failed";
  }
  return result.pending === 0 ? "success" : "failed";
}
