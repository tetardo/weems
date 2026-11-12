import type { FeatureKey, PlanId } from "@weems/contrats";
import { cache } from "react";
import { getMyPlanInfo } from "../api/plans-api.ts";
import { getPlanCatalog } from "../api/public-api.ts";
import { featureIncluded } from "./features.ts";

export interface MyFeatures {
  plan: PlanId;
  /** The pilot's plan includes this feature (API down: everything locked). */
  has: (key: FeatureKey) => boolean;
}

/** The logged-in pilot's plan and features, read once per page. */
export const getMyFeatures = cache(async (): Promise<MyFeatures> => {
  const [catalog, me] = await Promise.all([getPlanCatalog(), getMyPlanInfo()]);
  const plan = me?.plan ?? "pilot_free";
  return { plan, has: (key) => (catalog ? featureIncluded(catalog, plan, key) : false) };
});
