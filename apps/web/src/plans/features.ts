import type { FeatureKey, PlanCatalog, PlanId } from "@weems/contrats";

/**
 * Whether a plan includes a feature, read in the catalog of the API (decision 015): a limit or
 * "unlimited" counts as included, false as locked. A key the catalog does not know is locked.
 */
export function featureIncluded(catalog: PlanCatalog, plan: PlanId, key: FeatureKey): boolean {
  const value = catalog.features.find((feature) => feature.key === key)?.values[plan];
  return value !== undefined && value !== false;
}
