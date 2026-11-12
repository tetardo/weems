import type { FeatureKey, FeatureValue, PlanCatalog, PlanOffer } from "@weems/contrats";
import { useLocale, useTranslations } from "next-intl";
import { CardBox } from "../ui/card-box.tsx";
import { DoneIcon, ExcludedIcon } from "../ui/icons.ts";
import { featureGroups, formatPrice } from "./plan-display.ts";

/** A cell of the table: tick, dash, or the limit as the feature words it (« 12 mois », « Illimités* »). */
function ValueCell({ feature, value }: { feature: FeatureKey; value: FeatureValue }) {
  const t = useTranslations("Plans");
  if (value === true) {
    return (
      <DoneIcon size={17} className="mx-auto text-success" aria-label={t("values.included")} />
    );
  }
  if (value === false) {
    return (
      <ExcludedIcon size={17} className="mx-auto text-muted/60" aria-label={t("values.excluded")} />
    );
  }
  const own = `features.${feature}.${value === "unlimited" ? "cellUnlimited" : "cell"}` as const;
  if (!t.has(own)) return <b>{value === "unlimited" ? t("values.unlimited") : value}</b>;
  return <b>{t(own, { count: value === "unlimited" ? 0 : value })}</b>;
}

function PlanHeader({ plan }: { plan: PlanOffer }) {
  const t = useTranslations("Plans");
  const locale = useLocale();
  return (
    <th scope="col" className={`px-3 py-4 align-top ${plan.recommended ? "bg-accent/10" : ""}`}>
      <span className="block font-title text-base">{t(`names.${plan.id}`)}</span>
      <span className="block text-sm font-normal text-muted">
        {formatPrice(plan.monthlyCents, locale)}{" "}
        {t(plan.monthlyCents === 0 ? "price.forever" : "price.perMonth")}
      </span>
    </th>
  );
}

/** Every feature of the catalogue, plan by plan (page /plans/compare). Scrolls inside its card on phones. */
export function CompareTable({ catalog }: { catalog: PlanCatalog }) {
  const t = useTranslations("Plans");
  const cell = "border-t border-line px-3 py-2.5";
  return (
    <CardBox flush className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-center text-sm">
        <thead>
          <tr>
            <th scope="col" className="px-4 py-4 text-left align-bottom text-muted">
              {t("compare.feature")}
            </th>
            {catalog.plans.map((plan) => (
              <PlanHeader key={plan.id} plan={plan} />
            ))}
          </tr>
        </thead>
        {featureGroups(catalog).map(([group, features]) => (
          <tbody key={group}>
            <tr>
              <th
                colSpan={catalog.plans.length + 1}
                scope="colgroup"
                className={`${cell} bg-bg text-left text-xs tracking-wider text-muted uppercase`}
              >
                {t(`groups.${group}`)}
              </th>
            </tr>
            {features.map((feature) => (
              <tr key={feature.key}>
                <th scope="row" className={`${cell} px-4 text-left font-normal`}>
                  {t(`features.${feature.key}.label`)}
                </th>
                {catalog.plans.map((plan) => (
                  <td key={plan.id} className={`${cell} ${plan.recommended ? "bg-accent/10" : ""}`}>
                    <ValueCell feature={feature.key} value={feature.values[plan.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </CardBox>
  );
}
