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
