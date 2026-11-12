import type {
  FeatureGroup,
  FeatureValue,
  PlanCatalog,
  PlanFeature,
  PlanOffer,
} from "@weems/contrats";

/** Pure helpers of the page Offres: what each card lists and how prices read. */

/** One line of a plan card: the feature and its value in that plan. */
export interface CardLine {
  readonly key: PlanFeature["key"];
  readonly value: FeatureValue;
}

/** What the API says a plan includes is "more" than in the plan it contains. */
function adds(value: FeatureValue, parent: FeatureValue | undefined): boolean {
  return value !== false && value !== parent;
}

/**
 * Lines of a plan card: the card features this plan adds to the plan it includes (all its card
 * features for the first plan). Follows the API catalogue, so a new feature shows up by itself.
 */
export function cardLines(catalog: PlanCatalog, plan: PlanOffer): CardLine[] {
  return catalog.features
    .filter((feature) => feature.onCard)
    .filter((feature) =>
      adds(feature.values[plan.id], plan.includes ? feature.values[plan.includes] : undefined),
    )
    .map((feature) => ({ key: feature.key, value: feature.values[plan.id] }));
}

/** Features grouped for the comparison table, groups in the order they first appear. */
export function featureGroups(catalog: PlanCatalog): [FeatureGroup, PlanFeature[]][] {
  const groups = new Map<FeatureGroup, PlanFeature[]>();
  for (const feature of catalog.features) {
    groups.set(feature.group, [...(groups.get(feature.group) ?? []), feature]);
  }
  return [...groups];
}

/** "4,99 €", "19 €", "0 €": cents only when there are some. */
export function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
