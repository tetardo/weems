import type { GoalView } from "@weems/contrats";

/** Colour of a goal: green ahead or reached, orange behind or missed, accent otherwise. */
export function toneOf(goal: GoalView): string {
  if (goal.status === "achieved" || goal.pace === "ahead") return "var(--color-success)";
  if (goal.status === "missed" || goal.pace === "behind") return "var(--color-accent-2)";
  return "var(--color-accent)";
}

/** Share of the goal reached, 0 to 1. */
export const shareOf = (goal: Pick<GoalView, "value" | "total">) =>
  goal.total > 0 ? Math.min(goal.value / goal.total, 1) : 0;
