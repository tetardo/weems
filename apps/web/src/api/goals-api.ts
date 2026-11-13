import { type GoalDefinition, Goals, GoalView } from "@weems/contrats";
import { apiRequest } from "./api-request.ts";

/** Page Objectifs of the private logbook (spec carnet privé, § 6). */
export function getGoals(): Promise<Goals | null> {
  return apiRequest("/v1/me/goals", Goals);
}

export function createGoal(definition: GoalDefinition): Promise<GoalView | null> {
  return apiRequest("/v1/me/goals", GoalView, { method: "POST", body: definition });
}

export function updateGoal(goalId: string, definition: GoalDefinition): Promise<GoalView | null> {
  const path = `/v1/me/goals/${encodeURIComponent(goalId)}`;
  return apiRequest(path, GoalView, { method: "PUT", body: definition });
}

export function archiveGoal(goalId: string): Promise<GoalView | null> {
  const path = `/v1/me/goals/${encodeURIComponent(goalId)}/archive`;
  return apiRequest(path, GoalView, { method: "POST" });
}
