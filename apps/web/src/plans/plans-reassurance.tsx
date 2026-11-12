import { useTranslations } from "next-intl";
import { CardBox } from "../ui/card-box.tsx";
import { CompanyIcon, DataIcon, type IconComponent, NoCommitmentIcon } from "../ui/icons.ts";

const ITEMS: readonly [IconComponent, "data" | "free" | "members"][] = [
  [DataIcon, "data"],
  [NoCommitmentIcon, "free"],
  [CompanyIcon, "members"],
];

/** Three promises under the plans, and the fair use limit of « unlimited » pilots. */
export function PlansReassurance({ fairUse }: { fairUse: number }) {
  const t = useTranslations("Plans");
  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {ITEMS.map(([Icon, item]) => (
          <CardBox key={item} className="flex gap-3">
            <Icon size={22} className="flex-none text-link" aria-hidden="true" />
            <div>
              <p className="m-0 font-semibold">{t(`reassure.${item}Title`)}</p>
              <p className="m-0 text-sm text-muted">{t(`reassure.${item}Text`)}</p>
            </div>
          </CardBox>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{t("fairUse", { count: fairUse })}</p>
    </>
  );
}
