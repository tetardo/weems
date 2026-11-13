import type { LogbookStats, LogbookStatsPeriod } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { monthlyActivity } from "../profiles/charts.ts";
import { flyingDays } from "./flying-days.ts";
import { activityOf, takeoffRhythm } from "./stats-activity.ts";
import { aircraftOf, airportsOf, categoriesOf, favoriteRoutes } from "./stats-fleet.ts";
import type { Tracks } from "./stats-input.ts";
import { categoryTrends, landingsOf } from "./stats-landings.ts";
import { goodPracticesOf, phaseTimeOf } from "./stats-technique.ts";

const DAY_MS = 86_400_000;
const PERIOD_DAYS: Record<LogbookStatsPeriod, number> = { "30d": 30, "12m": 365, all: Infinity };
const REGULARITY_WEEKS = 53;

/** What the page computes, as the plan allows (spec carnet privé, § 5). */
export interface StatsOptions {
  period: LogbookStatsPeriod;
  allowedPeriods: LogbookStatsPeriod[];
  /** The plan includes these Pilot Pro blocks. */
  pro: { categoryTrends: boolean; phaseTime: boolean; goodPractices: boolean };
  airportName: (icao: string) => string | null;
}

/** Flights opened within the period; `closed` are newest first. */
export function inPeriod(
  closed: readonly SummaryWithEvents[],
  period: LogbookStatsPeriod,
  now: Date,
): SummaryWithEvents[] {
  const from = now.getTime() - PERIOD_DAYS[period] * DAY_MS;
  return closed.filter(({ summary }) => Date.parse(summary.openedAt) >= from);
}

/**
 * Page Statistiques of the private logbook, from every closed flight of the pilot (newest first)
 * and the simplified trajectories of the flights of the period.
 */
export function logbookStats(
  closed: readonly SummaryWithEvents[],
  tracks: Tracks,
  options: StatsOptions,
  now: Date,
): LogbookStats {
  const flights = inPeriod(closed, options.period, now);
  const { pro } = options;
  return {
    period: options.period,
    allowedPeriods: options.allowedPeriods,
    activity: activityOf(flights, tracks),
    regularity: flyingDays(closed, now, REGULARITY_WEEKS),
    months: monthlyActivity(closed, now),
    ...takeoffRhythm(flights, tracks),
    categories: categoriesOf(flights),
    aircraft: aircraftOf(flights),
    airports: airportsOf(flights, options.airportName),
    routes: favoriteRoutes(flights),
    landings: landingsOf(flights),
    categoryTrends: pro.categoryTrends ? categoryTrends(flights) : null,
    phaseTime: pro.phaseTime ? phaseTimeOf(flights) : null,
    goodPractices: pro.goodPractices ? goodPracticesOf(flights, tracks) : null,
  };
}
