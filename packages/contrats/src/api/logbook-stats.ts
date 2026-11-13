import { z } from "zod";
import { AircraftCategory } from "./aircraft-class.ts";
import { IcaoCode, UtcTimestamp } from "./common.ts";
import { FlightPhase } from "../flight/phase.ts";
import { FlyingDay } from "./logbook.ts";

/**
 * Page Statistiques of the private logbook (spec carnet privé, § 5; maquette B v10): figures by
 * theme over a period. Pilot Free: 30 days or 12 months (key statsPeriod); Pilot Pro: all time,
 * trends by category, time per phase and good practices (null when the plan lacks them).
 */

const Count = z.number().int().nonnegative();
const Seconds = z.number().nonnegative();
const Share = z.number().min(0).max(1);

/** Periods offered by the page, shortest first. */
export const LOGBOOK_STATS_PERIODS = ["30d", "12m", "all"] as const;
export const LogbookStatsPeriod = z.enum(LOGBOOK_STATS_PERIODS);
export type LogbookStatsPeriod = z.infer<typeof LogbookStatsPeriod>;

/** Rules followed, flight by flight (the band marks of the page Vols, provisional criteria). */
export const GOOD_PRACTICES = ["noAlert", "speed250", "sinkRate", "bank30"] as const;
export const GoodPractice = z.enum(GOOD_PRACTICES);
export type GoodPractice = z.infer<typeof GoodPractice>;

const Activity = z.object({
  flights: Count,
  airborneS: Seconds,
  /** Days (UTC) with at least one flight. */
  flyingDays: Count,
  averageBlockS: Seconds.nullable(),
  longestBlockS: Seconds.nullable(),
  /** Airborne time by day and by night, from the trajectories (sun under the horizon). */
  dayS: Seconds,
  nightS: Seconds,
});

const CategoryTime = z.object({
  category: AircraftCategory.nullable(),
  flights: Count,
  airborneS: Seconds,
});

const AircraftTime = CategoryTime.extend({ name: z.string() });

const AirportVisits = z.object({ icao: IcaoCode, name: z.string().nullable(), visits: Count });

/** A route flown both ways, counted together; airports in alphabetical order. */
const FavoriteRoute = z.object({
  airports: z.tuple([IcaoCode, IcaoCode]),
  flights: Count,
  blockS: Seconds,
  /** Mean final touchdown, ft/min (negative); null when none was measured. */
  touchdownAverage: z.number().nullable(),
});

const Landings = z.object({
  landed: Count,
  clean: Count,
  /** Touchdowns by bucket of TOUCHDOWN_BUCKETS_FPM: soft, normal, firm, hard. */
  buckets: z.array(Count),
  /** Last measured touchdowns of the period, oldest first (30 at most). */
  recent: z.array(z.object({ at: UtcTimestamp, touchdownVs: z.number() })),
});

const CategoryTrend = z.object({
  category: AircraftCategory.nullable(),
  flights: Count,
  touchdownAverage: z.number().nullable(),
  /** Mean touchdown of the newer half minus the older half, ft/min (> 0: softer); null under 6 landings. */
  trendFpm: z.number().nullable(),
  bounceShare: Share.nullable(),
});

const PhaseTime = z.object({
  /** Category whose flights are averaged: the most flown of the period. */
  category: AircraftCategory.nullable(),
  flights: Count,
  phases: z.array(z.object({ phase: FlightPhase, seconds: Seconds })),
});

const GoodPractices = z.array(
  z.object({ practice: GoodPractice, flights: Count, share: Share.nullable() }),
);

/** GET /v1/me/logbook/stats?period=: page Statistiques. */
export const LogbookStats = z.object({
  /** The period computed: a free pilot asking for « all » gets 12 months. */
  period: LogbookStatsPeriod,
  allowedPeriods: z.array(LogbookStatsPeriod),
  activity: Activity,
  /** Days with a flight over the last 53 weeks, oldest first (whatever the period). */
  regularity: z.array(FlyingDay),
  /** Airborne time of each of the last 12 months (UTC), oldest first (whatever the period). */
  months: z.array(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), airborneS: Seconds })),
  /** Airborne time by weekday of the takeoff (0 = Monday, local time of the place). */
  weekdays: z.array(Seconds).length(7),
  /** Takeoffs by local hour, by day or by night (sun at the place of takeoff). */
  takeoffHours: z.array(z.object({ day: Count, night: Count })).length(24),
  categories: z.array(CategoryTime),
  aircraft: z.array(AircraftTime),
  airports: z.array(AirportVisits),
  routes: z.array(FavoriteRoute),
  landings: Landings,
  categoryTrends: z.array(CategoryTrend).nullable(),
  phaseTime: PhaseTime.nullable(),
  goodPractices: GoodPractices.nullable(),
});
export type LogbookStats = z.infer<typeof LogbookStats>;
