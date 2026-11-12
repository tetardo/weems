import type { PlanOffer } from "@weems/contrats";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "./plan-display.ts";

export type Billing = "monthly" | "yearly";

/** Big price of the chosen billing period, the other one small underneath. */
export function PlanPrice({ plan, billing }: { plan: PlanOffer; billing: Billing }) {
  const t = useTranslations("Plans.price");
  const locale = useLocale();
  const free = plan.monthlyCents === 0;
  const yearly = billing === "yearly";
  const main = yearly ? plan.yearlyCents : plan.monthlyCents;
  const other = formatPrice(yearly ? plan.monthlyCents : plan.yearlyCents, locale);
  let unit = t(yearly ? "perYear" : "perMonth");
  let note = t(yearly ? "orPerMonth" : "orPerYear", { price: other });
  if (free) [unit, note] = [t("forever"), t("noCard")];
  return (
    <div className="px-5 pt-3">
      <p className="m-0 flex items-baseline gap-1.5">
        <span className="font-title text-[2em] font-bold">{formatPrice(main, locale)}</span>
        <span className="text-sm text-muted">{unit}</span>
      </p>
      <p className="m-0 text-sm text-muted">{note}</p>
    </div>
  );
}
