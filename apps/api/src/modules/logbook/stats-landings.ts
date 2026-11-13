import { landingSummary, TOUCHDOWN_BUCKETS_FPM, type LogbookStats } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { histogram } from "../profiles/charts.ts";
import { finalLandings, measured } from "../profiles/landings.ts";
import { groupBy, meanOf } from "./tally.ts";

const RECENT = 30;
/** Fewer measured landings than this in a category: no trend. */
const TREND_FROM = 6;

type Flights = readonly SummaryWithEvents[];

/** Theme Atterrissages: touchdowns by bucket, share of clean landings, last touchdowns. */
export function landingsOf(flights: Flights): LogbookStats["landings"] {
  const landings = finalLandings(flights);
  const withVs = measured(landings);
  return {
    landed: landings.length,
    clean: landings.filter((l) => l.clean).length,
    buckets: histogram(
      withVs.map((l) => Math.abs(l.touchdownVs)),
      TOUCHDOWN_BUCKETS_FPM,
    ),
    recent: withVs
      .slice(0, RECENT)
      .map(({ at, touchdownVs }) => ({ at, touchdownVs }))
      .reverse(),
  };
}

/** Newer half minus older half of touchdowns listed newest first; > 0 means softer. */
function trendOf(touchdowns: readonly number[]): number | null {
  if (touchdowns.length < TREND_FROM) return null;
  const half = Math.floor(touchdowns.length / 2);
  const newer = meanOf(touchdowns.slice(0, half));
  const older = meanOf(touchdowns.slice(half));
  return newer === null || older === null ? null : newer - older;
}

/** « Par catégorie d'avion » (Pilot Pro): mean touchdown, its trend and bounces, per category. */
export function categoryTrends(flights: Flights): NonNullable<LogbookStats["categoryTrends"]> {
  const groups = groupBy(flights, ({ summary }) => summary.aircraftClass?.category ?? null);
  return [...groups]
    .map(([category, group]) => {
      const landings = group.flatMap(({ events }) => landingSummary(events) ?? []);
      const touchdowns = landings.flatMap((l) => l.touchdownVs ?? []);
      const bounced = landings.filter((l) => l.bounces > 0).length;
      return {
        category,
        flights: group.length,
        touchdownAverage: meanOf(touchdowns),
        trendFpm: trendOf(touchdowns),
        bounceShare: landings.length === 0 ? null : bounced / landings.length,
      };
    })
    .sort((a, b) => b.flights - a.flights);
}
