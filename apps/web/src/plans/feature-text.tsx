import type { FeatureKey, FeatureValue } from "@weems/contrats";
import { useTranslations } from "next-intl";

/**
 * A feature as a plan card says it: its label when simply included, its limit when it has one
 * (« 1 objectif »), its unlimited wording otherwise (« Objectifs illimités »).
 */
export function FeatureText({ feature, value }: { feature: FeatureKey; value: FeatureValue }) {
  const t = useTranslations(`Plans.features.${feature}`);
  if (typeof value === "number") return <>{t("limited", { count: value })}</>;
  if (value === "unlimited") return <>{t("unlimited")}</>;
  return <>{t("label")}</>;
}

/**
 * A limit in a short cell, as the feature words it (« 12 mois », « Illimités* »), or the plain
 * number / « Illimité » when it has no wording of its own. Comparison table and page Fonctionnalités.
 */
export function FeatureLimit({
  feature,
  value,
}: {
  feature: FeatureKey;
  value: number | "unlimited";
}) {
  const t = useTranslations("Plans");
  const own = `features.${feature}.${value === "unlimited" ? "cellUnlimited" : "cell"}` as const;
  if (!t.has(own)) return <>{value === "unlimited" ? t("values.unlimited") : value}</>;
  return <>{t(own, { count: value === "unlimited" ? 0 : value })}</>;
}
