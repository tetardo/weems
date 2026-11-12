import { landingSummary, type PilotStats } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { sum } from "./sum.ts";

/** Final landing of a flight, as the profile shows it. */
export interface FinalLanding {
  at: string;
  airportIcao: string | null;
  /** Vertical speed at the first touchdown, ft/min; null when not measured. */
  touchdownVs: number | null;
  /** A single touchdown, no go-around. */
  clean: boolean;
}

/** Final landing of each flight that touched down, in the order of the flights. */
export function finalLandings(flights: readonly SummaryWithEvents[]): FinalLanding[] {
  return flights.flatMap(({ summary, events }) => {
    const landing = landingSummary(events);
    if (!landing) return [];
    return [
      {
        at: summary.openedAt,
        airportIcao: summary.plannedArrivalIcao,
        touchdownVs: landing.touchdownVs,
        clean: landing.bounces === 0 && landing.goArounds === 0,
      },
    ];
  });
}

/** The landings whose touchdown was measured. */
export function measured(
  landings: readonly FinalLanding[],
): (FinalLanding & { touchdownVs: number })[] {
  return landings.flatMap((landing) =>
    landing.touchdownVs === null ? [] : [{ ...landing, touchdownVs: landing.touchdownVs }],
  );
}

type Landing = NonNullable<PilotStats["bestLanding"]>;

/** Touchdown statistics of some flights: mean, softest, share of clean final landings. */
export function landingStats(flights: readonly SummaryWithEvents[]) {
  const landings = finalLandings(flights);
  const withVs = measured(landings);
  return {
    averageTouchdownVs:
      withVs.length === 0 ? null : sum(withVs.map((l) => l.touchdownVs)) / withVs.length,
    // Softest: the vertical speed closest to zero (they are negative).
    bestLanding: withVs.reduce<Landing | null>(
      (best, { touchdownVs, airportIcao, at }) =>
        !best || touchdownVs > best.touchdownVs ? { touchdownVs, airportIcao, at } : best,
      null,
    ),
    cleanLandings: { clean: landings.filter((l) => l.clean).length, landings: landings.length },
  };
}
