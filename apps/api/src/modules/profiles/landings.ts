import { landingSummary } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";

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
