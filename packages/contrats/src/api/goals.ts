import { z } from "zod";
import { AircraftCategory } from "./aircraft-class.ts";
import { FlightId, IcaoCode, UtcTimestamp } from "./common.ts";
import { GoodPractice } from "./logbook-stats.ts";

/**
 * Objectifs of the private logbook (spec carnet privé, § 6; maquette v12 B). The pilot sets a
 * target, Weems counts the flights. Pilot Free: 1 active goal (key goals; creating one archives
 * the current one). Pilot Pro: unlimited, suggestions (goalSuggestions), the type « Bonnes
 * pratiques » (goalGoodPractices).
 */

/** What is counted: hours, flights, soft touchdowns (under `threshold` ft/min), clean flights in
 * a row, hours on an aircraft, new airports, flying days per week, share of flights following a
 * practice (percent). */
export const GOAL_KINDS = [
  "hours",
  "flights",
  "softLandings",
  "cleanStreak",
  "aircraft",
  "airports",
  "regularity",
  "goodPractices",
] as const;
export const GoalKind = z.enum(GOAL_KINDS);
export type GoalKind = z.infer<typeof GoalKind>;

/** Until when: this week, this month (UTC, Monday first), a date, or no end. */
export const GOAL_WINDOWS = ["week", "month", "date", "none"] as const;
export const GoalWindow = z.enum(GOAL_WINDOWS);
export type GoalWindow = z.infer<typeof GoalWindow>;

/** The aircraft that count: a category, or an ICAO type; null: every aircraft. */
export const GoalAircraft = z.union([
  z.object({ category: AircraftCategory }),
  z.object({ model: z.string().min(1).max(10) }),
]);
export type GoalAircraft = z.infer<typeof GoalAircraft>;

const GoalFields = z.object({
  kind: GoalKind,
  /** Hours, flights, touchdowns, flights in a row, airports, days per week or percent. */
  target: z.number().positive().max(100_000),
  /** Soft touchdown: softer than this, ft/min (positive); null for the other kinds. */
  threshold: z.number().int().min(10).max(2000).nullable().default(null),
  /** « Bonnes pratiques » only. */
  practice: GoodPractice.nullable().default(null),
  aircraft: GoalAircraft.nullable().default(null),
  window: GoalWindow,
  /** window "date": the last day counted (UTC, YYYY-MM-DD). */
  until: z.iso.date().nullable().default(null),
  /** week or month: starts again at each period, the past ones stay in the history. */
  recurring: z.boolean().default(false),
});

type GoalFieldsValue = z.infer<typeof GoalFields>;

/** Rules between the fields: each is broken when its test is true. */
const GOAL_RULES: readonly [(goal: GoalFieldsValue) => boolean, string][] = [
  [
    (g) => (g.kind === "softLandings") !== (g.threshold !== null),
    "threshold goes with softLandings only",
  ],
  [
    (g) => (g.kind === "goodPractices") !== (g.practice !== null),
    "practice goes with goodPractices only",
  ],
  [(g) => g.kind === "aircraft" && g.aircraft === null, "aircraft needs an aircraft"],
  [(g) => (g.window === "date") !== (g.until !== null), "until goes with window date"],
  [
    (g) => g.recurring && g.window !== "week" && g.window !== "month",
    "only a week or a month goal can start again",
  ],
  [
    (g) => g.kind === "regularity" && (g.window === "none" || g.target > 7),
    "regularity: at most 7 days a week, over a period",
  ],
  [(g) => g.kind === "goodPractices" && g.target > 100, "goodPractices: a percent"],
];

/** POST /v1/me/goals and PUT /v1/me/goals/{goalId}. */
export const GoalDefinition = GoalFields.superRefine((goal, ctx) => {
  for (const [broken, message] of GOAL_RULES)
    if (broken(goal)) ctx.addIssue({ code: "custom", message });
});
export type GoalDefinition = z.infer<typeof GoalDefinition>;

export const GoalStatus = z.enum(["active", "achieved", "missed", "archived"]);
export type GoalStatus = z.infer<typeof GoalStatus>;

/** Against the steady pace that reaches the target at the end of the window. */
const GoalPace = z.enum(["ahead", "behind"]);

const Count = z.number().int().nonnegative();

/** A flight that moved the goal: what it added (hours, touchdowns, airports…). */
export const GoalFlight = z.object({
  flightId: FlightId,
  at: UtcTimestamp,
  departureIcao: IcaoCode.nullable(),
  arrivalIcao: IcaoCode.nullable(),
  added: z.number(),
});
export type GoalFlight = z.infer<typeof GoalFlight>;

/** One past period of a goal that starts again. */
export const GoalPeriod = z.object({
  from: UtcTimestamp,
  to: UtcTimestamp,
  value: z.number(),
  total: z.number(),
  reached: z.boolean(),
});
export type GoalPeriod = z.infer<typeof GoalPeriod>;

export const GoalView = z.object({
  goalId: z.uuid(),
  definition: GoalFields,
  createdAt: UtcTimestamp,
  status: GoalStatus,
  /** The window counted now (the current period of a goal that starts again). */
  from: UtcTimestamp,
  /** End of the window, excluded; null: no end. */
  to: UtcTimestamp.nullable(),
  /** Where the goal stands: hours, flights, touchdowns, flights in a row, airports, flying days
   * or percent. */
  value: z.number(),
  /** Value that reaches the goal: the target, or for regularity the days of the whole window. */
  total: z.number(),
  /** Value expected today at a steady pace; null without end. */
  expected: z.number().nullable(),
  pace: GoalPace.nullable(),
  /** Day the target is reached at the current pace; null without progress or when reached. */
  projection: UtcTimestamp.nullable(),
  /** Still needed per week to reach the target in time; null without end or when reached. */
  perWeekNeeded: z.number().nullable(),
  /** Flights that counted in the window. */
  flights: Count,
  /** Value after each counted flight, in time order (the cumulative chart). */
  series: z.array(z.object({ at: UtcTimestamp, value: z.number() })),
  /** The last flights that moved it, newest first (at most 5). */
  recentFlights: z.array(GoalFlight),
  /** Past periods of a goal that starts again, oldest first (at most 6). */
  previous: z.array(GoalPeriod),
  /** Clean flights in a row: the best streak in the window. */
  record: z.number().nullable(),
  /** When it was reached, missed or archived. */
  finishedAt: UtcTimestamp.nullable(),
});
export type GoalView = z.infer<typeof GoalView>;

/** A goal Weems proposes from the pilot's flights, with the figure it starts from. */
export const GoalSuggestion = z.object({
  definition: GoalFields,
  /** The pilot's current figure (mean touchdown, hours a month…), in the unit of the target. */
  basis: z.number(),
});
export type GoalSuggestion = z.infer<typeof GoalSuggestion>;

/** GET /v1/me/goals. */
export const Goals = z.object({
  active: z.array(GoalView),
  /** Reached, missed and archived goals, the last finished first (at most 10). */
  finished: z.array(GoalView),
  /** null: the plan does not include them (Pilot Pro). */
  suggestions: z.array(GoalSuggestion).nullable(),
  /** Active goals allowed at once; null: unlimited. */
  maxActive: z.number().int().positive().nullable(),
  goodPracticesAllowed: z.boolean(),
});
export type Goals = z.infer<typeof Goals>;
