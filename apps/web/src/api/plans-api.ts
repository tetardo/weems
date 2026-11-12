import { MyPlan, type PlanId } from "@weems/contrats";
import { cache } from "react";
import { hasSession } from "../auth/server-session.ts";
import { apiRequest } from "./api-request.ts";

/**
 * The logged-in pilot's plan and whether the test switch is offered; null for a visitor. Read
 * once per page (the bar and the page may both ask).
 */
export const getMyPlanInfo = cache(async (): Promise<MyPlan | null> => {
  if (!(await hasSession())) return null;
  return apiRequest("/v1/me/plan", MyPlan);
});

/** The logged-in pilot's plan (page Offres); null for a visitor, or when the API does not answer. */
export async function getMyPlan(): Promise<PlanId | null> {
  return (await getMyPlanInfo())?.plan ?? null;
}

/** Free/Pro test switch of the bar (outside production only): changes the pilot's plan. */
export async function setTestPlan(plan: PlanId): Promise<void> {
  await apiRequest("/v1/dev/me/plan", MyPlan, { method: "PUT", body: { plan } });
}
