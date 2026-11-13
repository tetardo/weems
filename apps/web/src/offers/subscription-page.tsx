import { FOUNDER_OFFER, type MyCodes, type MyFounder, type MyPlan } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { FounderBadge } from "../ui/founder-badge.tsx";
import { GiftIcon } from "../ui/icons.ts";
import { SectionMain } from "../ui/section-main.tsx";
import { daysUntil } from "./founder-display.ts";
import { FounderProgress } from "./founder-progress.tsx";
import { ReferralCodes } from "./referral-codes.tsx";

/** Current plan, and the Pilot Pro given without payment while it lasts. */
function PlanCard({ plan, now }: { plan: MyPlan; now: number }) {
  const t = useTranslations("Offers.plan");
  const names = useTranslations("Plans.names");
  const format = useFormatter();
  const { offered } = plan;
  return (
    <section className="rounded-panel border border-line bg-surface p-5">
      <p className="m-0 text-xs font-semibold tracking-wider text-muted uppercase">
        {t("current")}
      </p>
      <h2 className="m-0 mt-1 text-[1.5em]">{names(plan.plan)}</h2>
      {offered ? (
        <p className="m-0 mt-2 text-sm">
          <span className="font-semibold text-founder">{t(`offered.${offered.source}`)}</span>{" "}
          <span className="text-muted">
            {t("offeredUntil", {
              date: format.dateTime(new Date(offered.until), { dateStyle: "long" }),
              days: daysUntil(offered.until, now),
            })}
          </span>
        </p>
      ) : (
        <p className="m-0 mt-2 text-sm text-muted">{t("noGift")}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/plans" className={buttonClass("outline")}>
          {t("seePlans")}
        </Link>
        <Link href="/code" className={buttonClass("outline")}>
          <GiftIcon size={16} aria-hidden="true" />
          {t("enterCode")}
        </Link>
      </div>
    </section>
  );
}

/** Founder place: badge and lifetime discount, or progress towards a place. */
function FounderCard({ founder }: { founder: MyFounder }) {
  const t = useTranslations("Offers.plan");
  const confirmed = founder.place?.status === "confirmed" ? founder.place.number : null;
  if (!founder.eligible && confirmed === null) return null;
  return (
    <section className="rounded-panel border border-founder/45 bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-[1.15em]">{t("founderTitle")}</h2>
        {confirmed !== null && <FounderBadge number={confirmed} />}
      </div>
      <div className="mt-3">
        {confirmed === null ? (
          <FounderProgress mine={founder} />
        ) : (
          <p className="m-0 text-sm text-muted">
            {t("discount", { discount: FOUNDER_OFFER.discountPercent })}
          </p>
        )}
      </div>
    </section>
  );
}

interface Props {
  plan: MyPlan;
  founder: MyFounder | null;
  codes: MyCodes | null;
  now: number;
}

/** Page /settings/plan « Mon abonnement » (spec offre fondateurs). */
export function SubscriptionPage({ plan, founder, codes, now }: Props) {
  const t = useTranslations("Offers.plan");
  return (
    <SectionMain>
      <h1 className="m-0 mb-5 text-[2em]">{t("title")}</h1>
      <div className="grid max-w-3xl gap-4">
        <PlanCard plan={plan} now={now} />
        {founder && <FounderCard founder={founder} />}
        <ReferralCodes codes={codes?.referral ?? []} now={now} />
      </div>
    </SectionMain>
  );
}
