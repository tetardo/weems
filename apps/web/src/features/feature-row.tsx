import type { PlanCatalog, PlanFeature } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { FeatureLimit } from "../plans/feature-text.tsx";
import { featureLimits, firstPlanWith } from "./feature-display.ts";
import { FeatureIllustration } from "./feature-illustration.tsx";
import { PlanTag, SoonTag } from "./plan-tag.tsx";

/** Limits plan by plan: « Pilot Free 12 mois · Pilot Pro Toute la période ». */
function Limits({ catalog, feature }: { catalog: PlanCatalog; feature: PlanFeature }) {
  const t = useTranslations("Plans.names");
  const limits = featureLimits(catalog, feature);
  if (limits.length === 0) return null;
  return (
    <p className="m-0 mt-1.5 text-xs leading-snug text-muted">
      {limits.map(({ plan, value }, index) => (
        <span key={plan}>
          {index > 0 && " · "}
          {t(plan)}{" "}
          <b className="font-semibold text-ink">
            <FeatureLimit feature={feature.key} value={value} />
          </b>
        </span>
      ))}
    </p>
  );
}

/** One function of the catalogue: drawing, title, what it brings, plan, « Bientôt », limits. */
export function FeatureRow({ catalog, feature }: { catalog: PlanCatalog; feature: PlanFeature }) {
  const t = useTranslations(`Features.items.${feature.key}`);
  const plan = firstPlanWith(catalog, feature);
  return (
    <li className="grid grid-cols-[82px_1fr] items-start gap-x-3.5 gap-y-1.5 border-t border-line px-4 py-4 first:border-t-0 md:grid-cols-[82px_1fr_auto] md:px-5">
      <span className="grid place-items-center rounded-box border border-line bg-bg/60 p-1 max-md:row-span-2">
        <FeatureIllustration feature={feature.key} />
      </span>
      <div className="max-md:col-start-2 max-md:row-start-2">
        <h3 className="m-0 mb-0.5 text-[15px]">{t("title")}</h3>
        <p className="m-0 text-sm text-muted">{t("text")}</p>
        <Limits catalog={catalog} feature={feature} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 max-md:col-start-2 max-md:row-start-1 md:flex-col md:items-end">
        {plan && <PlanTag plan={plan} />}
        {feature.availability === "soon" && <SoonTag />}
      </div>
    </li>
  );
}
