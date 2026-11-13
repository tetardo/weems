import type { GoalDefinition } from "@weems/contrats";

const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;

/** A stretch of time counted by a goal; `to` excluded, null: no end. */
export interface GoalWindow {
  from: Date;
  to: Date | null;
}

const startOfDay = (at: Date) =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));

/** Monday 00:00 UTC of the week of `at`. */
function startOfWeek(at: Date): Date {
  const day = startOfDay(at);
  return new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY_MS);
}

const startOfMonth = (at: Date) => new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));

/** The week or the month holding `at`. */
function periodOf(kind: "week" | "month", at: Date): GoalWindow {
  if (kind === "week") {
    const from = startOfWeek(at);
    return { from, to: new Date(from.getTime() + WEEK_MS) };
  }
  const from = startOfMonth(at);
  return { from, to: new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1)) };
}

/**
 * The window counted now: the period of the creation (a week or a month goal counts the flights
 * of the whole period), the current one for a goal that starts again, from the creation day to
 * the chosen date, or from the creation day without end.
 */
export function currentWindow(goal: GoalDefinition, createdAt: Date, now: Date): GoalWindow {
  if (goal.window === "week" || goal.window === "month")
    return periodOf(goal.window, goal.recurring && now > createdAt ? now : createdAt);
  const from = startOfDay(createdAt);
  if (goal.window === "none" || goal.until === null) return { from, to: null };
  return { from, to: new Date(Date.parse(`${goal.until}T00:00:00.000Z`) + DAY_MS) };
}

/** Past periods of a goal that starts again, oldest first, at most `max`. */
export function previousWindows(
  goal: GoalDefinition,
  createdAt: Date,
  now: Date,
  max: number,
): GoalWindow[] {
  if (!goal.recurring || (goal.window !== "week" && goal.window !== "month")) return [];
  const kind = goal.window;
  const windows: GoalWindow[] = [];
  let window = periodOf(kind, createdAt);
  const current = periodOf(kind, now).from.getTime();
  while (window.from.getTime() < current && window.to) {
    windows.push(window);
    window = periodOf(kind, window.to);
  }
  return windows.slice(-max);
}

/** Whole weeks of a window (at least one), for the flying days of a regularity goal. */
export const weeksOf = (window: GoalWindow): number =>
  window.to ? Math.max(1, Math.round((window.to.getTime() - window.from.getTime()) / WEEK_MS)) : 1;
