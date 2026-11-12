import type { FeatureValue, PlanCatalog, PlanFeature, PlanId } from "@weems/contrats";

/** Pure helpers of the page Fonctionnalités: which plan a function starts in, and its limits. */

/** The first plan, in catalogue order, that includes the feature (null: in none yet). */
export function firstPlanWith(catalog: PlanCatalog, feature: PlanFeature): PlanId | null {
  return catalog.plans.find((plan) => feature.values[plan.id] !== false)?.id ?? null;
}

/** One limit of a feature in one plan (« Pilot Free : 12 mois »). */
export interface PlanLimit {
  readonly plan: PlanId;
  readonly value: number | "unlimited";
}

/**
 * The limits of a feature, plan by plan, when it has some (statistics period, goals, airlines,
 * pilots); empty when every plan either includes it or not.
 */
export function featureLimits(catalog: PlanCatalog, feature: PlanFeature): PlanLimit[] {
  const isLimit = (value: FeatureValue): value is number | "unlimited" =>
    typeof value === "number" || value === "unlimited";
  if (!Object.values(feature.values).some(isLimit)) return [];
  return catalog.plans.flatMap((plan) => {
    const value = feature.values[plan.id];
    return isLimit(value) ? [{ plan: plan.id, value }] : [];
  });
}
