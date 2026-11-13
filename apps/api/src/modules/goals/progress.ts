import type { GoalDefinition } from "@weems/contrats";
import { type FlightFact, onAircraft } from "./facts.ts";
import { type GoalWindow, weeksOf } from "./windows.ts";

/** One counted flight: what it added and where the goal stood after it. */
export interface Step {
  fact: FlightFact;
  added: number;
  value: number;
}

/** Where a goal stands over a window. */
export interface Progress {
  value: number;
  total: number;
  steps: Step[];
  /** First moment the value reached the total (cumulative kinds and streaks). */
  reachedAt: number | null;
  /** Best streak of clean flights; null for the other kinds. */
  record: number | null;
}

type Walker = (fact: FlightFact, value: number) => { added: number; value: number } | null;

const sum =
  (amount: (fact: FlightFact) => number): Walker =>
  (fact, value) => {
    const added = amount(fact);
    return { added, value: value + added };
  };

/** New airports: never seen in an earlier flight (before the window or within it). */
function airportsWalker(before: readonly FlightFact[]): Walker {
  const seen = new Set(before.flatMap((f) => [f.departureIcao, f.arrivalIcao]));
  return (fact, value) => {
    const fresh = [fact.departureIcao, fact.arrivalIcao].filter(
      (icao): icao is string => icao !== null && !seen.has(icao),
    );
    fresh.forEach((icao) => seen.add(icao));
    const added = new Set(fresh).size;
    return { added, value: value + added };
  };
}

function regularityWalker(): Walker {
  const days = new Set<number>();
  return (fact, value) => {
    const day = Math.floor(fact.at / 86_400_000);
    if (days.has(day)) return { added: 0, value };
    days.add(day);
    return { added: 1, value: value + 1 };
  };
}

/** Share (percent) of the flights where the practice could be checked. */
function practiceWalker(goal: GoalDefinition): Walker {
  let checked = 0;
  let kept = 0;
  return (fact) => {
    const followed = goal.practice ? fact.practices[goal.practice] : null;
    if (followed === null) return null;
    checked += 1;
    kept += followed ? 1 : 0;
    return { added: followed ? 1 : 0, value: (100 * kept) / checked };
  };
}

function walkerOf(goal: GoalDefinition, before: readonly FlightFact[]): Walker {
  const soft = goal.threshold ?? 0;
  switch (goal.kind) {
    case "hours":
    case "aircraft":
      return sum((f) => f.hours);
    case "flights":
      return sum(() => 1);
    case "softLandings":
      return sum((f) => (f.touchdownVs !== null && Math.abs(f.touchdownVs) < soft ? 1 : 0));
    case "cleanStreak":
      return (fact, value) =>
        fact.clean ? { added: 1, value: value + 1 } : { added: 0, value: 0 };
    case "airports":
      return airportsWalker(before);
    case "regularity":
      return regularityWalker();
    case "goodPractices":
      return practiceWalker(goal);
  }
}

/** What reaches the goal: the target, or the flying days of the whole window. */
const totalOf = (goal: GoalDefinition, window: GoalWindow) =>
  goal.kind === "regularity" ? goal.target * weeksOf(window) : goal.target;

/** The goal over a window, from every closed flight (oldest first). */
export function progressOf(
  goal: GoalDefinition,
  facts: readonly FlightFact[],
  window: GoalWindow,
): Progress {
  const from = window.from.getTime();
  const to = window.to?.getTime() ?? Infinity;
  const inside = (f: FlightFact) => f.at >= from && f.at < to && onAircraft(f, goal.aircraft);
  const walk = walkerOf(
    goal,
    facts.filter((f) => f.at < from),
  );
  const total = totalOf(goal, window);
  const steps: Step[] = [];
  let value = 0;
  let reachedAt: number | null = null;
  let record = 0;
  for (const fact of facts.filter(inside)) {
    const step = walk(fact, value);
    if (!step) continue;
    value = step.value;
    record = Math.max(record, value);
    steps.push({ fact, ...step });
    if (reachedAt === null && goal.kind !== "goodPractices" && value >= total) reachedAt = fact.at;
  }
  return { value, total, steps, reachedAt, record: goal.kind === "cleanStreak" ? record : null };
}
