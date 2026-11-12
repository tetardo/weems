import { MyPlan, type PlanId } from "@weems/contrats";
import { hasSession } from "../auth/server-session.ts";
import { apiRequest } from "./api-request.ts";

/** The logged-in pilot's plan (page Offres); null for a visitor, or when the API does not answer. */
export async function getMyPlan(): Promise<PlanId | null> {
  if (!(await hasSession())) return null;
  return (await apiRequest("/v1/me/plan", MyPlan))?.plan ?? null;
}
