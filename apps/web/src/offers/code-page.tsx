import { FOUNDER_OFFER } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { SectionMain } from "../ui/section-main.tsx";
import { RedeemForm } from "./redeem-form.tsx";

/** Page /code: a logged-in pilot enters an offer code (ambassador, referral, gift). */
export function CodePage({ code }: { code: string }) {
  const t = useTranslations("Offers.redeem");
  return (
    <SectionMain>
      <div className="mx-auto max-w-md rounded-panel border border-line bg-surface p-6">
        <h1 className="m-0 text-[1.6em]">{t("title")}</h1>
        <p className="mt-2 mb-5 text-sm text-muted">{t("lead")}</p>
        <RedeemForm code={code} />
        <p className="m-0 mt-5 border-t border-line pt-4 text-xs text-muted">
          {t("rules", { referralMonths: FOUNDER_OFFER.referralMonths })}
        </p>
      </div>
    </SectionMain>
  );
}
