import type { AircraftCategory, CategoryExperience, PilotStats } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { mostFlownTypes } from "./aircraft-usage.ts";
import { landingStats } from "./landings.ts";
import { sum } from "./sum.ts";

/** Types shown on a line of the block. */
const SHOWN_TYPES = 3;

const experience = (flights: readonly SummaryWithEvents[]) => ({
  airborneS: sum(flights.map(({ summary }) => summary.times.airborneS ?? 0)),
  flights: flights.length,
});

function byCategory(
  flights: readonly SummaryWithEvents[],
): Map<AircraftCategory, SummaryWithEvents[]> {
  const groups = new Map<AircraftCategory, SummaryWithEvents[]>();
  for (const flight of flights) {
    const category = flight.summary.aircraftClass?.category;
    if (category) groups.set(category, [...(groups.get(category) ?? []), flight]);
  }
  return groups;
}

function categoryLine(
  category: AircraftCategory,
  flights: readonly SummaryWithEvents[],
): CategoryExperience {
  const { averageTouchdownVs, bestLanding } = landingStats(flights);
  return {
    category,
    ...experience(flights),
    types: mostFlownTypes(flights, SHOWN_TYPES),
    averageTouchdownVs,
    bestLanding,
  };
}

/**
 * The block "Expérience par catégorie" of a public profile (spec J4, aircraft categories):
 * one line per flown category, most airborne time first, and single- and multi-engine time.
 */
export function experienceOf(flights: readonly SummaryWithEvents[]): PilotStats["experience"] {
  const categories = [...byCategory(flights)]
    .map(([category, own]) => categoryLine(category, own))
    .sort((a, b) => b.airborneS - a.airborneS || b.flights - a.flights);
  return {
    categories,
    singleEngine: experience(flights.filter((f) => f.engineCount === 1)),
    multiEngine: experience(flights.filter((f) => f.engineCount >= 2)),
  };
}
