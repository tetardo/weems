import type { MyRank } from "@weems/contrats";

/** Progress towards the next rank: share of each threshold (0 to 1) and what is missing. */
export interface RankProgress {
  hoursShare: number;
  flightsShare: number;
  missingHours: number;
  missingFlights: number;
}

const share = (done: number, need: number) => (need <= 0 ? 1 : Math.min(1, done / need));

/** At the last rank, both shares are full and nothing is missing. */
export function rankProgress(
  rank: Pick<MyRank, "validHours" | "validFlights" | "next">,
): RankProgress {
  const { next } = rank;
  if (!next) return { hoursShare: 1, flightsShare: 1, missingHours: 0, missingFlights: 0 };
  return {
    hoursShare: share(rank.validHours, next.hours),
    flightsShare: share(rank.validFlights, next.flights),
    missingHours: Math.max(0, Math.ceil(next.hours - rank.validHours)),
    missingFlights: Math.max(0, next.flights - rank.validFlights),
  };
}
