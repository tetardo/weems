"use server";

import { GoalDefinition } from "@weems/contrats";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ApiRefused } from "../../api/api-request.ts";
import { archiveGoal, createGoal, updateGoal } from "../../api/goals-api.ts";
import { getPathname } from "../../i18n/navigation.ts";
import { definitionOf } from "./goal-form-data.ts";

/** What the form shows after a refused goal. */
export interface GoalFormState {
  error: "invalid" | "refused" | null;
}

async function showGoal(goalId: string | undefined): Promise<never> {
  revalidatePath("/[locale]/logbook/goals", "page");
  const href = { pathname: "/logbook/goals", query: goalId ? { g: goalId } : {} };
  redirect(getPathname({ href, locale: await getLocale() }));
}

/** « Créer l'objectif » or, with `goalId`, « Modifier ». */
export async function saveGoalAction(
  goalId: string | null,
  _state: GoalFormState,
  form: FormData,
): Promise<GoalFormState> {
  const definition = definitionOf(form);
  if (!definition) return { error: "invalid" };
  let saved;
  try {
    saved = goalId ? await updateGoal(goalId, definition) : await createGoal(definition);
  } catch (error) {
    if (error instanceof ApiRefused) return { error: "refused" };
    throw error;
  }
  return showGoal(saved?.goalId);
}

/** « Ajouter » on a suggestion: the definition comes from the API, as JSON. */
export async function addSuggestionAction(json: string): Promise<void> {
  const created = await createGoal(GoalDefinition.parse(JSON.parse(json)));
  await showGoal(created?.goalId);
}

export async function archiveGoalAction(goalId: string): Promise<void> {
  await archiveGoal(goalId);
  await showGoal(undefined);
}
