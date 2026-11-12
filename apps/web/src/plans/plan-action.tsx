import type { PlanId, PlanOffer } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";

/**
 * The button of a plan card: « Votre formule » on the pilot's plan, « Créer un compte » on the
 * free plan for a visitor, otherwise upgrade or choose. No payment yet (lot 2): those last
 * buttons say so instead of acting.
 */
export function PlanAction({ plan, current }: { plan: PlanOffer; current: PlanId | null }) {
  const t = useTranslations("Plans");
  const name = t(`names.${plan.id}`);
  const wide = "w-full";
  if (plan.id === current) {
    return (
      <span
        className={`${buttonClass("outline")} ${wide} border-dashed text-muted`}
        aria-current="true"
      >
        {t("current")}
      </span>
    );
  }
  if (plan.monthlyCents === 0) {
    return current ? null : (
      <Link href="/signup" className={`${buttonClass("outline")} ${wide}`}>
        {t("cta.signup")}
      </Link>
    );
  }
  const label = t(plan.audience === "pilot" ? "cta.upgrade" : "cta.choose", { plan: name });
  return (
    <button
      type="button"
      aria-disabled="true"
      title={t("cta.soon")}
      className={`${buttonClass(plan.recommended ? "primary" : "outline")} ${wide} cursor-default`}
    >
      {label}
    </button>
  );
}
