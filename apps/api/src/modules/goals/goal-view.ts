import type { GoalDefinition, GoalPeriod, GoalStatus, GoalView } from "@weems/contrats";
import type { FlightFact } from "./facts.ts";
import { type Progress, progressOf, type Step } from "./progress.ts";
import { currentWindow, type GoalWindow, previousWindows, WEEK_MS } from "./windows.ts";

/** A goal as stored. */
export interface GoalRecord {
  goalId: string;
  definition: GoalDefinition;
  createdAt: Date;
  archivedAt: Date | null;
}

const RECENT_FLIGHTS = 5;
const PREVIOUS_PERIODS = 6;
const iso = (ms: number) => new Date(ms).toISOString();

/** Kinds whose value grows with time: a steady pace and a projection make sense. */
const paced = (goal: GoalDefinition) =>
  goal.kind !== "cleanStreak" && goal.kind !== "goodPractices";

function statusOf(
  record: GoalRecord,
  progress: Progress,
  window: GoalWindow,
  now: Date,
): { status: GoalStatus; finishedAt: number | null } {
  if (record.archivedAt) return { status: "archived", finishedAt: record.archivedAt.getTime() };
  if (record.definition.recurring) return { status: "active", finishedAt: null };
  if (progress.reachedAt !== null) return { status: "achieved", finishedAt: progress.reachedAt };
  const end = window.to?.getTime();
  if (end === undefined || now.getTime() < end) return { status: "active", finishedAt: null };
  const reached = progress.value >= progress.total;
  return { status: reached ? "achieved" : "missed", finishedAt: end };
}

/** Expected value today, pace, projected day and what is still needed per week. */
function paceOf(goal: GoalDefinition, progress: Progress, window: GoalWindow, now: number) {
  const none = { expected: null, pace: null, projection: null, perWeekNeeded: null };
  if (!paced(goal) || progress.value >= progress.total) return none;
  const from = window.from.getTime();
  const elapsed = Math.max(now - from, 1);
  const rate = progress.value / elapsed;
  const projection = rate > 0 ? iso(from + progress.total / rate) : null;
  const to = window.to?.getTime();
  if (to === undefined) return { ...none, projection };
  const expected = (progress.total * Math.min(elapsed, to - from)) / (to - from);
  const weeksLeft = Math.max((to - now) / WEEK_MS, 1 / 7);
  return {
    expected,
    pace: progress.value >= expected ? ("ahead" as const) : ("behind" as const),
    projection,
    perWeekNeeded: (progress.total - progress.value) / weeksLeft,
  };
}

const flightOf = (step: Step) => ({
  flightId: step.fact.flightId,
  at: iso(step.fact.at),
  departureIcao: step.fact.departureIcao,
  arrivalIcao: step.fact.arrivalIcao,
  added: step.added,
});

function previousOf(record: GoalRecord, facts: readonly FlightFact[], now: Date): GoalPeriod[] {
  const { definition, createdAt } = record;
  return previousWindows(definition, createdAt, now, PREVIOUS_PERIODS).map((window) => {
    const progress = progressOf(definition, facts, window);
    return {
      from: window.from.toISOString(),
      to: (window.to ?? now).toISOString(),
      value: progress.value,
      total: progress.total,
      reached: progress.value >= progress.total,
    };
  });
}

/** Everything the page shows of one goal, from the pilot's closed flights (oldest first). */
export function goalView(record: GoalRecord, facts: readonly FlightFact[], now: Date): GoalView {
  const { definition } = record;
  const window = currentWindow(definition, record.createdAt, now);
  const progress = progressOf(definition, facts, window);
  const { status, finishedAt } = statusOf(record, progress, window, now);
  return {
    goalId: record.goalId,
    definition,
    createdAt: record.createdAt.toISOString(),
    status,
    from: window.from.toISOString(),
    to: window.to?.toISOString() ?? null,
    value: progress.value,
    total: progress.total,
    ...(status === "active"
      ? paceOf(definition, progress, window, now.getTime())
      : { expected: null, pace: null, projection: null, perWeekNeeded: null }),
    flights: progress.steps.length,
    series: progress.steps.map((step) => ({ at: iso(step.fact.at), value: step.value })),
    recentFlights: progress.steps
      .filter((step) => step.added > 0)
      .slice(-RECENT_FLIGHTS)
      .reverse()
      .map(flightOf),
    previous: previousOf(record, facts, now),
    record: progress.record,
    finishedAt: finishedAt === null ? null : iso(finishedAt),
  };
}
