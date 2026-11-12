import type { PlanId } from "@weems/contrats";
import { useTranslations } from "next-intl";

/** One colour per plan, the same on every tag of the page. */
const TONE: Record<PlanId, string> = {
  pilot_free: "bg-success/12 text-success",
  pilot_pro: "bg-link/12 text-link",
  company: "bg-accent-2/12 text-accent-2",
  holding: "bg-holding/12 text-holding",
};

const TAG =
  "inline-flex items-center rounded-tag px-2 py-0.5 text-xs font-semibold whitespace-nowrap";

/** « Gratuit », « Dès Pilot Pro »…: the first plan that includes a function. */
export function PlanTag({ plan }: { plan: PlanId }) {
  const t = useTranslations();
  const label =
    plan === "pilot_free"
      ? t("Features.free")
      : t("Features.fromPlan", { plan: t(`Plans.names.${plan}`) });
  return <span className={`${TAG} ${TONE[plan]}`}>{label}</span>;
}

/** « Bientôt »: announced in the catalogue, not usable yet. */
export function SoonTag() {
  const t = useTranslations("Features");
  return <span className={`${TAG} border border-line font-medium text-muted`}>{t("soon")}</span>;
}
